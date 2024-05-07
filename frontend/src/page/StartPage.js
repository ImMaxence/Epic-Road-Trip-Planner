import { React, useState, useEffect } from 'react';
import { Typography, DatePicker, Button, AutoComplete, InputNumber, Layout, Card, Rate, Tooltip, Form, Skeleton, Space } from 'antd';
import { SmileFilled, SearchOutlined, HeartOutlined } from '@ant-design/icons';
import CardTravel from '../component/CardTravel';
import { useInView } from 'react-intersection-observer';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import ResearchCity from '../component/ResearchCity';
import moment from 'moment';
import axios from 'axios'

const { RangePicker } = DatePicker;
const { Title, Paragraph, Text } = Typography;
const { Content } = Layout;
const { Meta } = Card;

const StartPage = () => {

    const navigate = useNavigate();

    const [data, setData] = useState();

    const [formValues, setFormValues] = useState({
        startCity: '',
        endCity: '',
        dateRange: null
    });

    const { startCity, endCity, dateRange } = formValues;

    const handleSelectValue = (selectedCity) => {
        setFormValues({ ...formValues, startCity: selectedCity });
    };

    const handleSelectValue2 = (selectedCity) => {
        setFormValues({ ...formValues, endCity: selectedCity });
    };

    const handleDateChange = (dates) => {
        setFormValues({ ...formValues, dateRange: dates });
    };

    const [formDisabled, setFormDisabled] = useState(false);

    const onFinish = (values) => {
        console.log('Success:', values);
        console.log(startCity)
        enterLoading(0)
        setFormDisabled(true);
    };
    const onFinishFailed = (errorInfo) => {
        console.log('Failed:', errorInfo);
    };

    const dateFormatList = ['DD/MM/YYYY', 'DD/MM/YY', 'DD-MM-YYYY', 'DD-MM-YY'];

    const disabledDate = (current) => {
        // Disable all dates before today
        return current && current < dayjs().startOf('day');
    };

    const { ref, inView, entry } = useInView({
    });

    const mockVal = (str, repeat = 1) => ({
        value: str.repeat(repeat),
    });

    const [loadings, setLoadings] = useState([]);

    const enterLoading = (index) => {
        setLoadings((prevLoadings) => {
            const newLoadings = [...prevLoadings];
            newLoadings[index] = true;
            return newLoadings;
        });
        setTimeout(() => {
            setLoadings((prevLoadings) => {
                const newLoadings = [...prevLoadings];
                newLoadings[index] = false;
                return newLoadings;
            });
            let difTime = dateRange[1] - dateRange[0];
            var daysDifference = Math.floor(difTime / 1000 / 60 / 60 / 24);
            difTime -= daysDifference * 1000 * 60 * 60 * 24

            const startDate = moment(dateRange[0].$d);
            const endDate = moment(dateRange[1].$d);
            const formatStartDate = startDate.format("DD/MM/YYYY");
            const formatEndDate = endDate.format("DD/MM/YYYY");

            let url = '/maps?startCity=' + encodeURIComponent(startCity) + '&endCity=' + encodeURIComponent(endCity) + '&startDate=' + encodeURIComponent(formatStartDate) + '&endDate=' + encodeURIComponent(formatEndDate) + '&dateRange=' + encodeURIComponent(daysDifference) + '&author=' + encodeURIComponent("John Doe") + '&mapSteps=' + encodeURIComponent('0') + '&colorLine=' + encodeURIComponent('#1677ff');
            navigate(url);
        }, 2000);
    };

    useEffect(() => {

        axios.get(`http://${process.env.REACT_APP_BACK_HOST}:${process.env.REACT_APP_BACK_PORT}/api/travel/travelAndUserLimit`)
            .then((res) => {

                setTimeout(() => {
                    setData(res.data)
                }, 3000)
            })
            .catch((err) => {
                console.log(err);
            });
    }, [])

    const isSubmitDisabled = !(startCity && endCity && dateRange);

    return (
        <>
            <Content className='container_content'>

                <div className="pattern_responsive"></div>

                <div className="manage_patern">
                    <div className="pattern_1"></div>
                    <div className="pattern_2"></div>
                    <div className="pattern_3"></div>
                </div>


                <div className="wrapper_container_home">


                    <div className="container_home_left">
                        <img src="./image/plane.svg" alt="" />
                        <img src="./image/golden.svg" alt="" />
                        <img src="./image/berlin.svg" alt="" />
                    </div>
                    <div className="container_home_right">
                        <div className="container_main_text">
                            <Title level={1} className='title'>Bienvenue dans votre<br></br>Planificateur de Voyage 🚙💨🇫🇷</Title>
                        </div>
                    </div>
                </div>

                <div className="search_item">

                    <Form className='item_to_center' layout='inline' onFinish={onFinish} onFinishFailed={onFinishFailed}>
                        <Form.Item>
                            <ResearchCity nameInput="Ville de départ" onSelectValue={handleSelectValue} />
                        </Form.Item>

                        <Form.Item>
                            <ResearchCity nameInput="Ville de destination" onSelectValue={handleSelectValue2} />
                        </Form.Item>

                        <Form.Item>
                            <DatePicker.RangePicker format={dateFormatList} disabledDate={disabledDate} onChange={handleDateChange} />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" loading={loadings[0]} disabled={isSubmitDisabled} htmlType="submit">
                                C'est parti !
                            </Button>
                        </Form.Item>
                    </Form>

                </div>


                <div className="container_top_exp">
                    <Title className='title'>Les meilleurs expériences sont sur <Text mark className='title2'>CoqEnVoyage 🐣</Text></Title>

                    <div className="container_to_flex">

                        {data ? (
                            data.map((item, index) => (
                                <CardTravel key={index} idPhoto={item.photoProfil} nameUser={item.user.username} title={item.titre} url={item.travel} idTravel={item.id} start={item.villeDepart} end={item.villeFin} create={item.dateCreation} />
                            ))
                        ) : (
                            <>
                                <div className='skelete_loading_start'>
                                    <Skeleton.Input active={true} size='large' />
                                    <Skeleton.Input active={true} size='large' />
                                    <Skeleton.Input active={true} size='large' />
                                </div>
                                <div className='skelete_loading_start'>
                                    <Skeleton.Input active={true} size='large' />
                                    <Skeleton.Input active={true} size='large' />
                                    <Skeleton.Input active={true} size='large' />
                                </div>
                                <div className='skelete_loading_start'>
                                    <Skeleton.Input active={true} size='large' />
                                    <Skeleton.Input active={true} size='large' />
                                    <Skeleton.Input active={true} size='large' />
                                </div>
                                <div className='skelete_loading_start'>
                                    <Skeleton.Input active={true} size='large' />
                                    <Skeleton.Input active={true} size='large' />
                                    <Skeleton.Input active={true} size='large' />
                                </div>
                                <div className='skelete_loading_start'>
                                    <Skeleton.Input active={true} size='large' />
                                    <Skeleton.Input active={true} size='large' />
                                    <Skeleton.Input active={true} size='large' />
                                </div>
                                <div className='skelete_loading_start'>
                                    <Skeleton.Input active={true} size='large' />
                                    <Skeleton.Input active={true} size='large' />
                                    <Skeleton.Input active={true} size='large' />
                                </div>
                            </>
                        )}

                    </div>
                </div>

                <div className={`${inView ? "container_why show" : "container_why"}`} ref={ref}>

                    <div className="item1">
                        <img src="./image/camera.png" alt="camera" />
                        <Title level={5} className='title'>Points d'intérêt</Title>
                        <Text className='text'>
                            Découvrez les points d'intérêt le long de votre itinéraire, y compris les sites naturels, les monuments culturels et les lieux de divertissement. Choisissez ceux que vous souhaitez visiter, et ils seront ajoutés à votre itinéraire</Text>

                    </div>
                    <div className="item2">
                        <img src="./image/map.png" alt="map" />
                        <Title level={5} className='title'>Itinéraire personnalisé</Title>
                        <Text className='text'>Créez un road trip qui reflète vos préférences. Concevez votre voyage vous-même et choisissez ce que vous souhaitez voir et faire en fonction de vos envies</Text>

                    </div>
                    <div className="item3">
                        <img src="./image/suitcase.png" alt="case" />
                        <Title level={5} className='title'>Voyage planifié</Title>
                        <Text className='text'>Organisez votre voyage en sélectionnant votre voiture de location, en réservant vos hôtels et en choisissant des activités parmi les prestataires de voyage sélectionnés par nous</Text>

                    </div>
                </div>
            </Content>

        </>


    );
};

export default StartPage;