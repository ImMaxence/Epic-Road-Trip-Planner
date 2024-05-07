import { React, useState, useEffect } from 'react';
import { Typography, DatePicker, Button, AutoComplete, InputNumber, Layout, Card, Rate, Tooltip, Form, Skeleton, Space, Spin, Select, Input } from 'antd';
import CardTravel from '../component/CardTravel';
import { LoadingOutlined } from '@ant-design/icons';
import axios from 'axios'
import ResearchCity from '../component/ResearchCity';

const AllTravel = () => {

    const [data, setData] = useState()
    const [defaultData, setDefault] = useState()
    const [user, setUser] = useState("")
    const [ville, setVille] = useState("")

    const [like, setLike] = useState()

    // const [scrolled, setScrolled] = useState(false);

    // useEffect(() => {
    //     window.onscroll = function () {
    //         if (window.scrollY > 20) {
    //             setScrolled(true);
    //         } else {
    //             setScrolled(false);
    //         }
    //     };
    // }, []);

    useEffect(() => {
        axios.get(`http://${process.env.REACT_APP_BACK_HOST}:${process.env.REACT_APP_BACK_PORT}/api/travel/allTravelAndUser`)
            .then((res) => {

                setTimeout(() => {
                    setData(res.data)
                    setDefault(res.data)
                }, 3000)
            })
            .catch((err) => {
                console.log(err);
            });

        if (localStorage.getItem('id')) {
            if (localStorage.getItem('id')) {

                axios.get(`http://${process.env.REACT_APP_BACK_HOST}:${process.env.REACT_APP_BACK_PORT}/api/users/oneUser/${localStorage.getItem('id')}`, {
                    headers: {
                        "x-access-token": localStorage.getItem('accessToken')
                    }
                })
                    .then((res) => {
                        if (res.data.favoris === null) {
                            setLike([])
                        }
                        else {
                            setLike(res.data.favoris)
                        }
                    })
                    .catch((err) => {
                        console.log(err);
                    });
            }
        }
    }, [])

    const handleChange = (value) => {
        console.log(`selected ${value}`);

        let sortedItems = defaultData;

        switch (value) {
            case '1':
                sortedItems.sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation));
                break;
            case '2':
                sortedItems.sort((a, b) => new Date(a.dateCreation) - new Date(b.dateCreation));
                break;
            case '3':
                if (like && like.length > 0) {
                    sortedItems = sortedItems.filter(item => like.includes(item.id));
                } else {
                    setData(defaultData)
                }
            default:
                break;
        }

        setData(sortedItems)
    };

    const handleSelectValue = (selectedCity) => {
        setVille(selectedCity)
    };

    const handleSearch = () => {

        console.log(user, ville)

        let filteredData = defaultData;

        if (ville) {
            filteredData = filteredData.filter(item => item.villeDepart === ville);
        }

        if (user) {
            filteredData = filteredData.filter(item => item.user.username === user);
        }

        setData(filteredData);
    };




    return (
        <>
            <div className={"search_bar_card_travel floatingNav2"}>
                <Select
                    placeholder='Trier par'
                    className='item1'
                    onChange={handleChange}
                    options={[
                        {
                            value: '1',
                            label: 'Plus récent',
                        },
                        {
                            value: '2',
                            label: 'Plus vieux',
                        },
                        {
                            value: '3',
                            label: 'Vos favoris',
                        }
                    ]}
                />

                <ResearchCity nameInput="Ville de départ" onSelectValue={handleSelectValue} className='item2' />

                <Input placeholder="Par utilisateur" className='item3' onChange={(e) => setUser(e.target.value)} />

                <Button onClick={handleSearch}>Chercher</Button>
            </div>


            {data ? (
                <div className='grid_container_card_travel'>
                    {
                        data.map((item, index) => (

                            <CardTravel key={index} idPhoto={item.photoProfil} nameUser={item.user.username} title={item.titre} url={item.travel} idTravel={item.id} start={item.villeDepart} end={item.villeFin} create={item.dateCreation} />

                        ))
                    }
                </div>
            ) : (
                <>
                    <Spin
                        className='spinner_all'
                        indicator={
                            <LoadingOutlined
                                style={{
                                    fontSize: 34,
                                    color: 'black',
                                }}
                                spin
                            />
                        }
                    />
                </>
            )}

        </>
    );
};

export default AllTravel;