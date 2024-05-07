import { React, useState, useRef } from 'react';
import { Typography, Tooltipn, Button, Modal, Layout, Popconfirm, Form, Input, message } from 'antd';
import GoogleLoginButton from '../authentification/GoogleLoginButton';
import axios from 'axios';
import { useNavigate } from "react-router-dom"

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

const Register = () => {

    const [messageApi, contextHolder] = message.useMessage();

    const navigate = useNavigate();

    const formRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [formDisabled, setFormDisabled] = useState(false);
    const [open, setOpen] = useState(false);

    const onFinish = (values) => {
        const { username, email, passwordnew } = values;
        console.log('Success:', username, email, passwordnew);
        console.log('URL: ', `http://${process.env.REACT_APP_BACK_HOST}:${process.env.REACT_APP_BACK_PORT}/api/users/register`);

        axios.post(`http://${process.env.REACT_APP_BACK_HOST}:${process.env.REACT_APP_BACK_PORT}/api/users/register`, {
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
                    navigate("/")
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
        // console.log('Success:', username, email, passwordnew);
        console.log('URL: ', `http://${process.env.REACT_APP_BACK_HOST}:${process.env.REACT_APP_BACK_PORT}/api/users/register`);
        console.log('Failed:', errorInfo);
        messageApi.open({
            type: 'warning',
            content: 'Vous avez des champs non remplie !',
        });
    };

    return (
        <>
            {contextHolder}
            <Content className='container_register_page'>

                <Title mark>Créer votre compte !</Title>

                <div className="center_register">

                    <Form
                        layout='vertical'
                        onFinish={onFinish}
                        onFinishFailed={onFinishFailed}
                        autoComplete="on"
                        disabled={formDisabled}
                        ref={formRef}
                        className='form_register'
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

                        <Form.Item
                            name="confirm"
                            label="Confirmation mot de passe"
                            dependencies={['password']}
                            hasFeedback
                            rules={[
                                {
                                    required: true,
                                    message: 'Confirmer votre mot de passe',
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

                        <Form.Item>
                            <Button type="primary" htmlType="submit">
                                S'enregistrer 🚙💨
                            </Button>
                        </Form.Item>
                    </Form>
                </div>

                <div className='center_login'>
                    <Text>Ou continue avec</Text>
                </div>

                <div style={{ marginTop: 20 }}>
                    <GoogleLoginButton />
                </div>


            </Content>
        </>
    );
};

export default Register;