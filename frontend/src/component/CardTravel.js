import { React, useState, useEffect } from 'react';
import { Typography, DatePicker, Button, AutoComplete, InputNumber, Layout, Card, Rate, Tooltip, message, Avatar } from 'antd';
import { SmileFilled, SearchOutlined, HeartOutlined, ArrowDownOutlined, ArrowRightOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import city from "../../src/maps/save_travel_illustrations/city.jpg";
import fire from "../../src/maps/save_travel_illustrations/fire.jpg";
import forest from "../../src/maps/save_travel_illustrations/forest.jpg"
import montagne from "../../src/maps/save_travel_illustrations/montagne.jpg"
import plage from "../../src/maps/save_travel_illustrations/plage.jpg"
import { useNavigate } from "react-router-dom";
import axios from "axios";
const { RangePicker } = DatePicker;
const { Title, Paragraph, Text } = Typography;
const { Content } = Layout;
const { Meta } = Card;

const CardTravel = ({ idPhoto, nameUser, title, url, idTravel, start, end, create }) => {

    const [photo, setPhoto] = useState(city);

    const [like, setLike] = useState();

    const [messageApi, contextHolder] = message.useMessage();

    const navigate = useNavigate();

    useEffect(() => {

        console.log("useEffect")

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

        switch (idPhoto) {
            case 1:
                setPhoto(city)
                break;
            case 2:
                setPhoto(fire)
                break;
            case 3:
                setPhoto(forest)
                break;
            case 4:
                setPhoto(montagne)
                break;
            case 5:
                setPhoto(plage)
                break;
        }
    }, [])

    const handleLike = () => {

        console.log(like)

        if (localStorage.getItem('id')) {

            if (like.includes(idTravel)) {

                console.log("je passe dans le IF")

                axios.put(`http://${process.env.REACT_APP_BACK_HOST}:${process.env.REACT_APP_BACK_PORT}/api/users/favorisDelete/${localStorage.getItem('id')}`, {
                    idTravel: idTravel
                }
                    , {
                        headers: {
                            "x-access-token": localStorage.getItem('accessToken')
                        }
                    })
                    .then((res) => {
                        console.log(res.data);
                        setLike(oldArray => oldArray.filter(item => item !== idTravel));
                        messageApi.open({
                            type: 'success',
                            content: 'Voyage ajouté en favoris',
                        });

                    })
                    .catch((err) => {
                        console.log(err);
                        messageApi.open({
                            type: 'error',
                            content: 'Erreur serveur, veuillez réssayer plus tard',
                        });
                    });
            }

            else {
                console.log("je passe dans le ELSE")
                axios.put(`http://${process.env.REACT_APP_BACK_HOST}:${process.env.REACT_APP_BACK_PORT}/api/users/favorisGestion/${localStorage.getItem('id')}`, {
                    idTravel: idTravel
                }
                    , {
                        headers: {
                            "x-access-token": localStorage.getItem('accessToken')
                        }
                    })
                    .then((res) => {
                        console.log(res.data);
                        setLike(oldArray => [...oldArray, idTravel]);
                        messageApi.open({
                            type: 'success',
                            content: 'Voyage ajouté en favoris',
                        });

                    })
                    .catch((err) => {
                        console.log(err);
                        messageApi.open({
                            type: 'error',
                            content: 'Erreur serveur, veuillez réssayer plus tard',
                        });
                    });
            }

        }

        else {
            messageApi.open({
                type: 'warning',
                content: 'Vous devez vous connecter pour pouvoir like !',
            });
        }

    }

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();

        const formattedDay = day < 10 ? `0${day}` : day;
        const formattedMonth = month < 10 ? `0${month}` : month;

        return `${formattedDay}/${formattedMonth}/${year}`;
    }

    return (
        <>
            {contextHolder}
            <Card
                hoverable
                style={{
                    width: 320,
                }}
                cover={
                    <>
                        <div className='cover_img'>
                            <img alt="card_ph" src={photo} />
                        </div>
                    </>
                }>

                <div className="like_btn">
                    <Tooltip title="Like!">
                        <Button shape="circle" icon={<HeartOutlined />} style={{ paddingTop: "8px" }} size='large' onClick={handleLike} />
                    </Tooltip>
                </div>

                <div className="flex_card_trav">
                    <div className="left_card">
                        <Avatar style={{ backgroundColor: '#fde3cf', color: '#f56a00' }}>{nameUser[0]}</Avatar>
                        <span style={{ marginLeft: 10 }}>{nameUser}</span>
                    </div>
                    <div className="right_card">
                        <span>{formatDate(create)}</span>
                    </div>
                </div>

                <Meta title={title} style={{ marginTop: 10 }} />

                <div style={{
                    textAlign: 'left', marginTop: 20
                }}>
                    <Text>🚀 • {start.replace(/CP.*/, "")}</Text>

                    <br />
                    <Text>🏠 • {end.replace(/CP.*/, "")}</Text>
                </div >

                <div className="additional">
                    <Button type="primary" onClick={() => window.open(url, '_blank')}>
                        Voir plus
                    </Button>
                    {/* <Text>Crée par {nameUser}</Text> */}
                </div>
            </Card >
        </>
    );
};

export default CardTravel;