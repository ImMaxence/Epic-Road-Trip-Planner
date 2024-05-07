import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Drawer, Button, Timeline, Dropdown, Menu, Typography, Flex, Form, Input, Space, ColorPicker, Select, DatePicker, message, Modal, Avatar, Radio } from 'antd';
import { HomeOutlined, LogoutOutlined, SaveOutlined, MinusCircleOutlined, PlusOutlined, DownOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
//import { useHistory } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import ResearchCity from './ResearchCity';
import communeV2 from "../../src/maps/communes_codepostalV2.json";

import city from "../../src/maps/save_travel_illustrations/city.jpg";
import fire from "../../src/maps/save_travel_illustrations/fire.jpg";
import forest from "../../src/maps/save_travel_illustrations/forest.jpg"
import montagne from "../../src/maps/save_travel_illustrations/montagne.jpg"
import plage from "../../src/maps/save_travel_illustrations/plage.jpg"
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import domtoimage from 'dom-to-image';

import logo from "../../src/maps/pdf/rooster.png";

import dayjs from 'dayjs';
import axios from 'axios';
import MyPDF from './MyPDF';
const { Text } = Typography;

const MenuMaps = () => {

    const [searchv3] = useSearchParams();

    const [messageApi, contextHolder] = message.useMessage();

    const [screen, setScreen] = useState(null);

    const handleChange = (value, index) => {

        const currentUrl = new URL(window.location.href);
        const params = new URLSearchParams(currentUrl.search);

        const stepKey = `children${index + 1}`;
        const stepKey2 = `step${index + 1}`;
        const existingStep = params.get(stepKey2);

        const actual = searchv3.get(`step${index + 1}`);
        const date1 = searchv3.get('startDate')
        const date2 = searchv3.get('endDate')

        if (existingStep) {
            params.set(stepKey, value);
            // console.log(actual)
            //console.log(date1)

            for (let i = 0; i < value.length; i++) {
                switch (value[i]) {
                    case 'restanrants':
                        axios.get(`http://${process.env.REACT_APP_BACK_HOST}:${process.env.REACT_APP_BACK_PORT}/api/eat?latitude=${getLatLong(actual).latitude}&longitude=${getLatLong(actual).longitude}&condition={"date_min":"${date1}","date_max":"${date2}","distance_max":"10"}`)
                            .then(response => {
                                console.log('Données reçues :', response.data);
                            })
                            .catch(error => {
                                console.error('ERROR :', error);
                            });
                        break;
                    case 'bars':
                        axios.get(`http://${process.env.REACT_APP_BACK_HOST}:${process.env.REACT_APP_BACK_PORT}/api/drink?latitude=${getLatLong(actual).latitude}&longitude=${getLatLong(actual).longitude}&condition={"date_min":"${date1}","date_max":"${date2}","distance_max":"10"}`)
                            .then(response => {
                                console.log('Données reçues :', response.data);
                            })
                            .catch(error => {
                                console.error('ERROR :', error);
                            });
                        break;
                    case 'loisirs':
                        axios.get(`http://${process.env.REACT_APP_BACK_HOST}:${process.env.REACT_APP_BACK_PORT}/api/enjoy?latitude=${getLatLong(actual).latitude}&longitude=${getLatLong(actual).longitude}&condition={"date_min":"${date1}","date_max":"${date2}","distance_max":"10"}`)
                            .then(response => {
                                console.log('Données reçues :', response.data);
                            })
                            .catch(error => {
                                console.error('ERROR :', error);
                            });
                        break;
                    case 'hotels':
                        axios.get(`http://${process.env.REACT_APP_BACK_HOST}:${process.env.REACT_APP_BACK_PORT}/api/sleep?latitude=${getLatLong(actual).latitude}&longitude=${getLatLong(actual).longitude}&condition={"date_min":"${date1}","date_max":"${date2}","distance_max":"10"}`)
                            .then(response => {
                                console.log('Données reçues :', response.data);
                            })
                            .catch(error => {
                                console.error('ERROR :', error);
                            });
                        break;
                    case 'transports':
                        axios.get(`http://${process.env.REACT_APP_BACK_HOST}:${process.env.REACT_APP_BACK_PORT}/api/travel?latitude=${getLatLong(actual).latitude}&longitude=${getLatLong(actual).longitude}&condition={"date_min":"${date1}","date_max":"${date2}","distance_max":"10"}`)
                            .then(response => {
                                console.log('Données reçues :', response.data);
                            })
                            .catch(error => {
                                console.error('ERROR :', error);
                            });
                        break;
                    default:
                        return null;
                }
            }

            navigate(currentUrl.pathname + '?' + params.toString());
        } else {
            return null
        }
    };

    const getLatLong = (location) => {
        if (location === undefined) {
            return null
        }
        else {
            //     console.log("dddd : " + location)
            const { latitude, longitude } = communeV2[decodeURIComponent(location).replace(/"/g, '')];
            return { latitude, longitude };
        }

    };

    const dateFormatList = ['DD/MM/YYYY', 'DD/MM/YY', 'DD-MM-YYYY', 'DD-MM-YY'];

    const options = [
        {
            label: '🍺 Bars',
            value: 'bars',
            emoji: '🍺',
            desc: 'Bars',
        },
        {
            label: '🥗 Restaurants',
            value: 'restanrants',
            emoji: '🥗',
            desc: 'Restaurants',
        },
        {
            label: '👾 Loisirs',
            value: 'loisirs',
            emoji: '👾',
            desc: 'Loisirs',
        },
        {
            label: '🏠 Hébergements',
            value: 'hotels',
            emoji: '🏠',
            desc: 'Hébergements',
        },
        {
            label: '🚗 Transports',
            value: 'transports',
            emoji: '🚗',
            desc: 'Transports',
        },
    ];

    const navigate = useNavigate();

    const [open, setOpen] = useState(false);
    const [search, setSearch] = useSearchParams({ style_map: "landscape" });
    const [styleMapValue, setStyleMapValue] = useState("landscape");
    const [selectedStyle, setSelectedStyle] = useState("Défaut ☑️");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [searchV2] = useSearchParams();
    const startCity = searchV2.get("startCity");
    const endCity = searchV2.get("endCity");
    const dateRange = searchV2.get("dateRange");
    const author = searchV2.get("author");
    const mapSteps = searchV2.get("mapSteps");
    const startDate = searchV2.get("startDate");
    const endDate = searchV2.get("endDate");

    const [color, setColor] = useState("#1677ff");

    useEffect(() => {
        const initialColor = search.get("colorLine") || "#1677ff";
        setColor(initialColor);
        const initialStyleMapValue = searchV2.get("style_map") || "landscape";
        setStyleMapValue(initialStyleMapValue);
    }, []);

    useEffect(() => {
        const styles = {
            landscape: "Défaut ☑️",
            cycle: "Vélo 🚲",
            transport: "Transport 🚀",
            outdoors: "En plein air 🌸",
            "transport-dark": "Transport DARK 🖤",
            "spinal-map": "Feux 🔥",
            pioneer: "Far West 🤠",
            neighbourhood: "Quartier 🏠",
            atlas: "Atlas 🛀",
        };
        setSelectedStyle(styles[styleMapValue]);
    }, [styleMapValue]);


    const rgbToHex = (r, g, b) => {
        const toHex = (x) => {
            const hex = Math.round(x).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        return '#' + toHex(r) + toHex(g) + toHex(b);
    };

    const debounce = (func, delay) => {
        let timeoutId;
        return function (...args) {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            timeoutId = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    };

    const debouncedSetColor = useCallback(
        debounce((color) => {
            const hexColor = rgbToHex(color.metaColor.r, color.metaColor.g, color.metaColor.b);

            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.set('colorLine', hexColor);
            navigate(currentUrl.pathname + currentUrl.search)
        }, 400),
        []
    );

    const handleColorChange = (color) => {
        setColor(color);
        debouncedSetColor(color);
    };


    const handleMenuClick = (e) => {
        const value = e.key;
        setSearch((prevSearch) => {
            const params = new URLSearchParams(prevSearch);
            params.set("style_map", value);
            for (let [key, val] of search.entries()) {
                if (key !== "style_map") {
                    params.set(key, val);
                }
            }
            return params;
        });
        setStyleMapValue(value);
    };

    const menu = (
        <Menu onClick={handleMenuClick}>
            <Menu.Item key="landscape">Défaut ☑️</Menu.Item>
            <Menu.Item key="cycle">Vélo 🚲</Menu.Item>
            <Menu.Item key="transport">Transport 🚀</Menu.Item>
            <Menu.Item key="outdoors">En plein air 🌸</Menu.Item>
            <Menu.Item key="transport-dark">Transport DARK 🖤</Menu.Item>
            <Menu.Item key="spinal-map">Feux 🔥</Menu.Item>
            <Menu.Item key="pioneer">Far West 🤠</Menu.Item>
            <Menu.Item key="neighbourhood">Quartier 🏠</Menu.Item>
            <Menu.Item key="atlas">Atlas 🛀</Menu.Item>
        </Menu>
    );

    const showDrawer = () => {
        setOpen(true);
    };

    const onClose = () => {
        setOpen(false);
    };

    const handleChangeStartCity = (data) => {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('startCity', data);
        navigate(currentUrl.pathname + currentUrl.search)
    }

    const handleChangeEndCity = (data) => {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('endCity', data);
        navigate(currentUrl.pathname + currentUrl.search)
    }

    const handleChangeMapSteps = (data) => {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('mapSteps', data);
        navigate(currentUrl.pathname + currentUrl.search)
    }

    let totalSteps = 0;
    searchV2.forEach((value, key) => {
        if (key.startsWith("step")) {
            totalSteps++;
        }
    });

    const handleChangeAdd = (data, index) => {
        const currentUrl = new URL(window.location.href);
        const params = new URLSearchParams(currentUrl.search);

        const stepKey = `step${index + 1}`;
        const existingStep = params.get(stepKey);

        if (existingStep) {
            params.set(stepKey, data);
        } else {
            params.append(stepKey, data);
        }

        let stepIndex = 1;
        for (const [key, value] of params.entries()) {
            if (key.startsWith("step")) {
                const newKey = `step${stepIndex}`;
                if (key !== newKey) {
                    params.delete(key);
                    params.set(newKey, value);
                }
                stepIndex++;
            }
        }

        currentUrl.search = params.toString();
        window.history.replaceState({}, "", currentUrl.toString());
        handleChangeMapSteps(stepIndex - 1);
    };

    const handleRemoveStep = (index) => {
        setCurrentIndex((prev) => prev - 1)
        const currentUrl = new URL(window.location.href);
        const params = new URLSearchParams(currentUrl.search);

        const stepKey = `step${index + 1}`;
        params.delete(stepKey);

        let stepIndex = 1;
        for (const [key, value] of params.entries()) {
            if (key.startsWith("step")) {
                const newKey = `step${stepIndex}`;
                if (key !== newKey) {
                    params.delete(key);
                    params.set(newKey, value);
                }
                stepIndex++;
            }
        }

        currentUrl.search = params.toString();
        window.history.replaceState({}, "", currentUrl.toString());
        handleChangeMapSteps(stepIndex - 1);
    };

    const handleChangeDate = (date, dateString) => {
        const currentUrl = new URL(window.location.href);

        const parsedDate1 = dayjs(dateString[0], 'DD/MM/YYYY');
        const parsedDate2 = dayjs(dateString[1], 'DD/MM/YYYY');
        const daysDifference = parsedDate2.diff(parsedDate1, 'days');

        currentUrl.searchParams.set('startDate', dateString[0]);
        currentUrl.searchParams.set('endDate', dateString[1]);
        currentUrl.searchParams.set('dateRange', daysDifference);

        navigate(currentUrl.pathname + currentUrl.search)
    };

    const disabledDate = (current) => {
        return current && current < dayjs().startOf('day');
    };

    const handleSaveTrip = () => {

        if (localStorage.getItem('id')) {
            showModal();
        }

        else {
            messageApi.open({
                type: 'warning',
                content: 'Vous devez créer un compte pour pouvoir enregistrer une map',
            });
        }
    }

    const [isModalOpen, setIsModalOpen] = useState(false);
    const showModal = () => {
        setIsModalOpen(true);
    };
    const handleOk = () => {
        setIsModalOpen(false);
    };
    const handleCancel = () => {
        setIsModalOpen(false);
    };

    const onFinish = (values) => {
        console.log('Success:', values);
        const { username, photo } = values;

        let idPhoto = 1;
        switch (photo) {
            case 'Ville':
                idPhoto = 1
                break;
            case 'Feux':
                idPhoto = 2
                break;
            case 'Forêt':
                idPhoto = 3
                break;
            case 'Montagne':
                idPhoto = 4
                break;
            case 'Plage':
                idPhoto = 5
                break;
        }

        let start = searchV2.get("startCity");
        let end = searchV2.get("endCity");
        let url = window.location.href;

        axios.post(`http://${process.env.REACT_APP_BACK_HOST}:${process.env.REACT_APP_BACK_PORT}/api/travel/addTravel`, {

            idUser: localStorage.getItem('id'),
            travel: url,
            titre: username,
            photoProfil: idPhoto,
            dateCreation: new Date(),
            villeDepart: start,
            villeFin: end
        }
            , {
                headers: {
                    "x-access-token": localStorage.getItem('accessToken')
                }
            })
            .then((res) => {
                console.log(res.data);
                messageApi.open({
                    type: 'success',
                    content: 'Road trip enregistré avec succès ! Retrouvez dans Accueil > Tous les voyages > Mes Voyages',
                });
                //setFormDisabled(true);
                setTimeout(() => { handleCancel() }, 1000)

            })
            .catch((err) => {
                console.log(err);
                messageApi.open({
                    type: 'error',
                    content: 'Erreur serveur, veuillez réssayer plus tard',
                });
            });
    };

    const onFinishFailed = (errorInfo) => {
        console.log('Failed:', errorInfo);
        messageApi.open({
            type: 'error',
            content: 'Erreur serveur, vueillez patientez...',
        });
        setTimeout(() => { handleCancel() }, 1000)
    };

    const [selectedAvatar, setSelectedAvatar] = useState(null);

    const avatarOptions = ["Ville", "Feux", "Forêt", "Montagne", "Plage"];

    const contentRef = useRef(null);
    const [imageData, setImageData] = useState(null);

    const capturePage = () => {
        domtoimage.toPng(document.getElementById('map'))
            .then((dataUrl) => {
                setImageData(dataUrl);
                captureImageData(dataUrl);
            })
            .catch((error) => {
                console.error('Error capturing element:', error);
            });
    };

    const captureImageData = (dataUrl) => {
        const pdf = new jsPDF();
        const img = new Image();
        img.src = dataUrl;
        img.onload = () => {
            const imgWidth = pdf.internal.pageSize.getWidth() + 50
            const imgHeight = (img.height * imgWidth) / img.width;

            pdf.addImage(img, 'PNG', 0, 60, imgWidth, imgHeight);
            pdf.addImage(logo, 'PNG', 10, 10, 15, 15);
            pdf.text('COQ EN VOYAGE', 86, 20)
            pdf.text('Départ :', 10, 40)
            pdf.text('Arrivée :', 10, 50)
            pdf.text(startCity, 32, 40)
            pdf.text(endCity, 32, 50)
            pdf.text('Du :', 155, 40)
            pdf.text('Au :', 155, 50)
            pdf.text(startDate, 170, 40)
            pdf.text(endDate, 170, 50)
            pdf.text('Récapitulatif du Trip', 80, 220)

            pdf.save('capture.pdf');
        };
    };


    return (
        <>
            {contextHolder}
            <Modal title="Enregistrer votre voyage" open={isModalOpen} onOk={handleOk} onCancel={handleCancel} footer={[null]}>

                <Form
                    layout='vertical'
                    onFinish={onFinish}
                    onFinishFailed={onFinishFailed}
                    autoComplete="on"
                >
                    <Form.Item
                        label="Nom voyage"
                        name="username"
                        rules={[
                            {
                                required: true,
                                message: 'Veuillez rentrer le nom de votre voyage',
                            },
                        ]}
                    >
                        <Input maxLength={30} />
                    </Form.Item>

                    <Form.Item
                        label="Illustration"
                        name="photo"
                        rules={[
                            {
                                required: true,
                                message: 'Veuillez choisir une illustration',
                            },
                        ]}
                    >
                        <Radio.Group
                            onChange={(e) => setSelectedAvatar(e.target.value)}
                            value={selectedAvatar}
                        >
                            {avatarOptions.map((avatar) => (
                                <Radio.Button
                                    value={avatar}>
                                    {avatar}
                                </Radio.Button>
                            ))}
                        </Radio.Group>

                    </Form.Item>

                    {selectedAvatar === "Ville" && (
                        <>
                            <Avatar shape='square' size={240} src={city} />
                        </>
                    )}
                    {selectedAvatar === "Feux" && (
                        <>
                            <Avatar shape='square' size={240} src={fire} />
                        </>
                    )}
                    {selectedAvatar === "Forêt" && (
                        <>
                            <Avatar shape='square' size={240} src={forest} />
                        </>
                    )}
                    {selectedAvatar === "Montagne" && (
                        <>
                            <Avatar shape='square' size={240} src={montagne} />
                        </>
                    )}
                    {selectedAvatar === "Plage" && (
                        <>
                            <Avatar shape='square' size={240} src={plage} />
                        </>
                    )}


                    <Form.Item className='modal_sub'>
                        <Button key="back" onClick={handleCancel} style={{ right: '15px' }}>
                            Annuler
                        </Button>
                        <Button type="primary" htmlType="submit">
                            Enregistrer
                        </Button>
                    </Form.Item>
                </Form>

            </Modal>
            <div className="container_menu_maps">
                <ColorPicker value={color} onChange={handleColorChange} disabledAlpha />
                <Dropdown overlay={menu} trigger={['click']} placement="bottomLeft">
                    <Button>{selectedStyle}</Button>
                </Dropdown>
                <Button type="primary" onClick={showDrawer}>
                    Modifier votre road trip
                </Button>
                <Button type="primary" onClick={handleSaveTrip}>
                    Enregistrer <SaveOutlined />
                </Button>
                <Button onClick={() => navigate("/")}>
                    Accueil <LogoutOutlined />
                </Button>
            </div>

            <Drawer
                title="🐓 CoqEnVoyage"
                placement='left'
                closable={true}
                onClose={onClose}
                open={open}
                key='left'
            >

                <Flex vertical>

                    <DatePicker.RangePicker style={{ width: 240 }} disabledDate={disabledDate} format={dateFormatList} onChange={handleChangeDate} placeholder={[startDate, endDate]} />

                    <Text>Ville de départ</Text>
                    <ResearchCity nameInput={startCity} onSelectValue={handleChangeStartCity} />
                    <Text>Ville de destination</Text>
                    <ResearchCity nameInput={endCity} onSelectValue={handleChangeEndCity} />
                    <Form
                        name="dynamic_form_nest_item"
                        autoComplete="off"
                        style={{ marginTop: "20px", width: 240 }}
                    >
                        <Form.List name="step" initialValue={[...Array(totalSteps || 0)].map((_, index) => ({ dummy: index }))}>
                            {(fields, { add, remove }) => (
                                <>
                                    {fields.map(({ key, name, fieldKey }, index) => {
                                        const stepParamName = `step${index + 1}`;
                                        const currentStepValue = searchV2.get(stepParamName) || "";
                                        setCurrentIndex(index + 1);
                                        return (
                                            <Form.Item key={key} className='force_flex'>
                                                <Text>Étape numéro : {index + 1}</Text>  <MinusCircleOutlined id='remove' onClick={() => {
                                                    remove(name);
                                                    handleRemoveStep(index);
                                                    // setCurrentIndex(index);
                                                }} />
                                                <ResearchCity nameInput={currentStepValue || "Ajouter un lieux"} onSelectValue={(data) => handleChangeAdd(data, index)} />
                                                <Select
                                                    mode="multiple"
                                                    style={{
                                                        width: '100%',
                                                    }}
                                                    placeholder="Voir des activitées"
                                                    onChange={(value) => handleChange(value, index)}
                                                    options={options}
                                                    optionRender={(option) => (
                                                        <Space>
                                                            <span role="img" aria-label={option.data.label}>
                                                                {option.data.emoji}
                                                            </span>
                                                            {option.data.desc}
                                                        </Space>
                                                    )}
                                                />
                                                <Text>index : {index}</Text>
                                            </Form.Item>
                                        );
                                    })}
                                    <Form.Item>
                                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                            Ajouter une étape {fields.length}
                                        </Button>
                                    </Form.Item>
                                </>
                            )}
                        </Form.List>
                    </Form>

                    <Text>nombre etapes : {mapSteps}</Text>
                    <Text>start date {startDate}</Text>
                    <Text>end date {endDate}</Text>
                    <Text>date range {dateRange}</Text>
                    <Text>auteur : {author}</Text>

                    {/* <PDFDownloadLink document={<MyPDF imgGeneral={screen} />} fileName='FORM'>
                        <Button onClick={() => handleScreen()}>Recap en pdf</Button>
                    </PDFDownloadLink> */}

                    <div>
                        <div id='caca' ref={contentRef}>
                            <p>some content</p>
                        </div>
                        <button onClick={capturePage}>Capture & Generate PDF</button>
                    </div>

                </Flex>
            </Drawer>
        </>
    );
};

export default MenuMaps;
