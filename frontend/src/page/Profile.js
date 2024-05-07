import { React, useState, useRef, useEffect } from 'react';
import { Typography, Tooltipn, Button, Modal, Layout, Popconfirm, Form, Input, Skeleton, message } from 'antd';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

const Profile = () => {

    const [data, setData] = useState();

    const navigate = useNavigate()

    const [messageApi, contextHolder] = message.useMessage();

    const formRef = useRef(null);
    const [screen, setScreen] = useState(null);
    const [loading, setLoading] = useState(false);
    const [formDisabled, setFormDisabled] = useState(false);
    const [open, setOpen] = useState(false);
    const showModal = () => {
        setOpen(true);
        setFormDisabled(false)
    };
    const handleOk = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setOpen(false);
        }, 3000);
    };
    const handleCancel = () => {
        setOpen(false);
        if (formRef.current) {
            formRef.current.resetFields();
        }
    };

    const confirm = () =>
        new Promise((resolve) => {
            setTimeout(() => {

                axios.delete(`http://${process.env.REACT_APP_BACK_HOST}:${process.env.REACT_APP_BACK_PORT}/api/users/${localStorage.getItem('id')}`, {
                    headers: {
                        "x-access-token": localStorage.getItem('accessToken')
                    }
                })
                    .then((res) => {
                        console.log(res.data);
                        resolve(null)
                        localStorage.clear();
                        navigate("/");
                        window.location.reload()
                    })
                    .catch((err) => {
                        console.log(err);
                        messageApi.open({
                            type: 'error',
                            content: 'Erreur serveur, veuillez réssayer plus tard',
                        });
                        resolve(null)
                    });
            }, 3000);
        });

    const onFinish = (values) => {
        console.log('Success:', values);
        const { username, email, password, passwordnew } = values;

        // faire le if password actuel === password rentrer par le user alors OK sinon erreur message API
        // le faire directement dans le back car non possible en front

        axios.put(`http://${process.env.REACT_APP_BACK_HOST}:${process.env.REACT_APP_BACK_PORT}/api/users/update/${localStorage.getItem('id')}`, {
            username: username,
            email: email,
            password: password,
            newPassword: passwordnew
        }, {
            headers: {
                "x-access-token": localStorage.getItem('accessToken')
            }
        })
            .then((res) => {
                setFormDisabled(true);
                console.log(res.data)
                window.location.reload();
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
            content: 'Erreur serveur, veuillez réssayer plus tard',
        });
    };

    useEffect(() => {
        axios.get(`http://127.0.0.1:8080/api/users/oneUser/${localStorage.getItem('id')}`, {
            headers: {
                "x-access-token": localStorage.getItem('accessToken')
            }
        })
            .then((res) => {
                console.log(res.data);
                setTimeout(() => {
                    setData(res.data);
                }, 3000)

            })
            .catch((err) => {
                console.log(err);
                messageApi.open({
                    type: 'error',
                    content: 'Erreur serveur, veuillez réssayer plus tard',
                });
            });
    }, [])

    const formatDate = (inputDate) => {
        console.log(inputDate)
        const dateObj = new Date(inputDate);
        const formattedDate = `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
        return formattedDate;
    };

    return (
        <>
            {contextHolder}
            <Content className='container_content_profile'>

                <div className="container_custom_profile">
                    <Title level={3}>Bienvenue sur votre profil 🐓</Title>
                    <div className="item a">
                        <Text>Votre adresse mail : </Text>

                        {data ? (
                            <>
                                <Text keyboard>{data.email}</Text>
                            </>
                        ) : (
                            <>
                                <Skeleton.Input active="true" size="small" />
                            </>
                        )}

                    </div>
                    <div className="item b">
                        <Text>Votre nom : </Text>

                        {data ? (
                            <>
                                <Text keyboard>{data.username}</Text>
                            </>
                        ) : (
                            <>
                                <Skeleton.Input active="true" size="small" />
                            </>
                        )}
                    </div>
                    <div className="item c">
                        <Text>Votre mot de passe : </Text>
                        {data ? (
                            <>
                                <Text keyboard>************</Text>
                            </>
                        ) : (
                            <>
                                <Skeleton.Input active="true" size="small" />
                            </>
                        )}
                    </div>
                    <div className="item e">
                        <Text>Compte créer le : </Text>
                        {data ? (
                            <>
                                <Text keyboard>{formatDate(data.dateCreationUser)}</Text>
                            </>
                        ) : (
                            <>
                                <Skeleton.Input active="true" size="small" />
                            </>
                        )}
                    </div>
                    <div className="item d">
                        <Button type='primary' onClick={showModal} disabled={!data}>Modifier vos informations</Button>
                        <Popconfirm
                            title="Êtes-vous sûr ?"
                            description="Vous perdrez vos voyages enregistrés"
                            onConfirm={confirm}
                            onOpenChange={() => console.log('open change')}
                            cancelText="Non 🙏"
                            okText="Oui 😭"
                        >
                            <Button type="primary" danger>Supprimer mon compte</Button>
                        </Popconfirm>
                    </div>

                    <Modal
                        open={open}
                        title="Modifier vos informations"
                        onOk={handleOk}
                        onCancel={handleCancel}
                        footer={[null]}
                    >

                        <Form
                            layout='vertical'
                            onFinish={onFinish}
                            onFinishFailed={onFinishFailed}
                            autoComplete="on"
                            style={{ marginTop: '30px' }}
                            disabled={formDisabled}
                            ref={formRef}
                            initialValues={{
                                username: data ? data.username : null,
                                email: data ? data.email : null
                            }}

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
                                <Input maxLength={15} />
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
                                label="Mot de passe actuel"
                                name="password"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Veuillez rentrer votre mot de passe',
                                    },
                                ]}
                            >
                                <Input.Password />
                            </Form.Item>

                            <Form.Item
                                name="passwordnew"
                                label="Nouveau mot de passe"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Veuillez rentrer votre nouveau mot de passe',
                                    },
                                ]}
                                hasFeedback
                            >
                                <Input.Password />
                            </Form.Item>

                            <Form.Item
                                name="confirm"
                                label="Confirmation mot de passe"
                                dependencies={['password']}
                                hasFeedback
                                rules={[
                                    {
                                        required: true,
                                        message: 'Confirmer votre nouveau mot de passe',
                                    },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue('passwordnew') === value) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error('Le nouveau mot de passe rentrer ne correspond pas'));
                                        },
                                    }),
                                ]}
                            >
                                <Input.Password />
                            </Form.Item>

                            <Form.Item className='modal_sub'>
                                <Button key="back" onClick={handleCancel} style={{ right: '15px' }}>
                                    Annuler
                                </Button>
                                <Button type="primary" htmlType="submit">
                                    Modifier
                                </Button>
                            </Form.Item>
                        </Form>


                    </Modal>
                </div>

            </Content>
        </>
    );
};

export default Profile;