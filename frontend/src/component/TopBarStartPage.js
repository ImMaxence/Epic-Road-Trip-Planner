import { React, useEffect, useState, useRef } from 'react';
import { Layout, Menu, Typography, Avatar, Badge, Drawer, Button, Modal, message, Form, Input } from 'antd';
import { UserOutlined, CodeOutlined, LogoutOutlined, MenuOutlined, UserAddOutlined } from "@ant-design/icons";
import { useNavigate } from 'react-router-dom';
import GoogleLoginButton from '../authentification/GoogleLoginButton';
import axios from 'axios';
const { Header } = Layout;
const { Title, Text } = Typography;

const TopBarStartPage = () => {

    const [messageApi, contextHolder] = message.useMessage();

    const formRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [formDisabled, setFormDisabled] = useState(false);
    const [open, setOpen] = useState(false);

    const handleCancel = () => {
        setIsModalOpen(false);
        if (formRef.current) {
            formRef.current.resetFields();
        }
    };

    const onFinish = (values) => {
        const { username, email, passwordnew } = values;
        console.log('Success:', username, email, passwordnew);

        axios.post(`http://${process.env.REACT_APP_BACK_HOST}:${process.env.REACT_APP_BACK_PORT}/api/users/login`, {
            username: username,
            email: email,
            password: passwordnew
        })
            .then(response => {
                console.log('Response:', response.data);
                localStorage.clear();
                localStorage.setItem('email', response.data.email);
                localStorage.setItem('username', response.data.username);
                localStorage.setItem('accessToken', response.data.accessToken);
                localStorage.setItem('id', response.data.id);

                messageApi.open({
                    type: 'success',
                    content: 'Compte créé avec succès',
                });
                setFormDisabled(true);
                setTimeout(() => {
                    window.location.reload();
                }, 1000)

            })
            .catch(error => {
                console.error('Error:', error);
                messageApi.open({
                    type: 'error',
                    content: 'Erreur serveur, veuillez patienter ou contacter le support',
                });
            });
    };

    const onFinishFailed = (errorInfo) => {
        console.log('Failed:', errorInfo);
        messageApi.open({
            type: 'warning',
            content: 'Vous avez des champs non remplie !',
        });
    };

    const [isModalOpen, setIsModalOpen] = useState(false);
    const showModal = () => {
        setIsModalOpen(true);
    };
    const handleOk = () => {
        setIsModalOpen(false);
    };

    const navigate = useNavigate();

    const [visible, setVisible] = useState(false);
    const showDrawer = () => {
        setVisible(!visible);
    };

    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        window.onscroll = function () {
            if (window.scrollY > 20) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };
    }, []);

    const handleNavigate = (link) => {
        window.scrollTo({ top: 0 });
        navigate(link);
        //  showDrawer();
    }

    const handleNavigateZ = (link) => {
        window.scrollTo({ top: 0 });
        navigate(link);
        showDrawer();
    }

    const handleLogOut = () => {
        console.log('log out');
        localStorage.clear();
        navigate("/")
        setVisible();
    }

    return (
        <>
            <Layout className='sticky_fix'>
                <Header className={scrolled ? "init_header_topnav floatingNav" : "init_header_topnav"}>

                    {contextHolder}

                    <div className="logo_topnav">
                        <img src="./image/rooster.png" alt="logo" />
                        <Title level={3} className='title'>CoqEnVoyage</Title>
                    </div>

                    <Modal title="Page de connexion" open={isModalOpen} onOk={handleOk} onCancel={handleCancel} footer={[null]}>
                        <Form
                            layout='vertical'
                            onFinish={onFinish}
                            onFinishFailed={onFinishFailed}
                            autoComplete="on"
                            style={{ marginTop: '30px' }}
                            disabled={formDisabled}
                            ref={formRef}
                            className='form_log_in'
                        >
                            <Form.Item
                                label="Nom"
                                name="username"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Veuillez rentrer un nom',
                                    },
                                ]}
                            >
                                <Input />
                            </Form.Item>

                            <Form.Item
                                label="Email"
                                name="email"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Veuillez rentrer un email',
                                    },
                                ]}
                            >
                                <Input />
                            </Form.Item>

                            <Form.Item
                                name="passwordnew"
                                label="Mot de passe"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Veuillez rentrer votre mot de passe',
                                    },
                                ]}
                                hasFeedback
                            >
                                <Input.Password />
                            </Form.Item>

                            <Form.Item className='force_right'>
                                <Button type="primary" htmlType="submit">
                                    Se connecter 🚗
                                </Button>
                            </Form.Item>
                        </Form>

                        <div className='center_login'>
                            <Text>Ou continue avec</Text>
                        </div>
                        <div className='google_center_login'>
                            <GoogleLoginButton />
                        </div>


                    </Modal>

                    <Menu mode="horizontal" defaultSelectedKeys={['home']} style={{ flex: 1, minWidth: 0, }} className='responsive_item'>
                        <Menu.Item key="home" onClick={() => handleNavigate("/")}>
                            Accueil
                        </Menu.Item>
                        <Menu.Item key="teammate" onClick={() => handleNavigate("/teammate")}>
                            L'équipe
                        </Menu.Item>

                        <Menu.Item key="travel" onClick={() => handleNavigate("/all-travel")}>
                            Tous les voyages
                        </Menu.Item>

                        {localStorage.getItem("id") ? (
                            <Menu.SubMenu
                                title={
                                    <>
                                        <span className="username">{localStorage.getItem('username')}</span>
                                        <Badge count={11} overflowCount={10}>
                                            <Avatar style={{ backgroundColor: '#fde3cf', color: '#f56a00' }}>{localStorage.getItem('username')[0]}</Avatar>
                                        </Badge>
                                    </>
                                }
                                className='avatar_top_bar'>
                                <Menu.Item key="profile" onClick={() => handleNavigate("/profile")}>
                                    <Badge dot offset={[13, 7]} size="small">
                                        <UserOutlined /> Profil
                                    </Badge>

                                </Menu.Item>
                                <Menu.Item key="logout" onClick={handleLogOut}>
                                    <Badge>
                                        <LogoutOutlined /> Se Déconnecter
                                    </Badge>
                                </Menu.Item>
                            </Menu.SubMenu>
                        ) : (
                            null
                        )}
                    </Menu>

                    {localStorage.getItem('id') ? (
                        null
                    ) : (
                        <div className='resp_to_hidden'>
                            <Button onClick={showModal}>
                                Se connecter
                            </Button>
                            <Button type='primary' style={{ marginLeft: 20 }} onClick={() => handleNavigate("/register")}>
                                Créer un compte
                            </Button>
                        </div>
                    )}

                    {/* FOR RESPONSIVE */}
                    <div className="responsive_top_bar">
                        <Button type="primary" onClick={showDrawer}><MenuOutlined /></Button>
                        <Drawer
                            title={"CoqEnVoyage"}
                            placement="right"
                            closable={true}
                            onClose={showDrawer}
                            visible={visible}
                            style={{ zIndex: 99999 }}
                        >
                            <Menu mode="inline" defaultSelectedKeys={['home']} style={{ flex: 1, minWidth: 0, }}>
                                <Menu.Item key="home" onClick={() => handleNavigateZ("/")}>
                                    Accueil
                                </Menu.Item>
                                <Menu.Item key="teammate" onClick={() => handleNavigateZ("/teammate")}>
                                    L'équipe
                                </Menu.Item>

                                <Menu.Item key="travel" onClick={() => handleNavigateZ("/all-travel")}>
                                    Tous les voyages
                                </Menu.Item>

                                {localStorage.getItem('id') ? (
                                    <Menu.SubMenu
                                        title={
                                            <>
                                                <Badge dot>
                                                    <UserAddOutlined /> {localStorage.getItem('username')}
                                                </Badge>
                                            </>
                                        }
                                        className='avatar_top_bar'>
                                        <Menu.Item key="profile" onClick={() => handleNavigateZ("/profile")}>
                                            <Badge dot offset={[13, 7]} size="small">
                                                <UserOutlined /> Profil
                                            </Badge>

                                        </Menu.Item>

                                        <Menu.Item key="log-out" onClick={handleLogOut}>
                                            <Badge>
                                                <LogoutOutlined /> Se Déconnecter
                                            </Badge>
                                        </Menu.Item>
                                    </Menu.SubMenu>
                                ) : null}

                            </Menu>
                            {localStorage.getItem('id') ? (
                                null
                            ) : (
                                <div className='responsive_btn_login'>
                                    <Button onClick={() => {
                                        showDrawer()
                                        showModal()
                                    }}>
                                        Se connecter
                                    </Button>
                                    <Button type='primary' style={{ marginLeft: 20 }} onClick={() => handleNavigate("/register")}>
                                        Créer un compte
                                    </Button>
                                </div>
                            )}
                        </Drawer>
                    </div>


                </Header>
            </Layout>
        </>
    );
};

export default TopBarStartPage;