import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useGoogleLogin } from '@react-oauth/google';
// import { jwtDecode } from "jwt-decode";
import axios from 'axios';
import { Button } from 'antd'
import { GoogleCircleFilled } from '@ant-design/icons'

const GoogleLoginButton = () => {
    const login = useGoogleLogin({
        onSuccess: async ({ code }) => {
            // Demande au back de demander a google un token(index.js)
            const tokens = await axios.post(`http://${process.env.REACT_APP_BACK_HOST}:${process.env.REACT_APP_BACK_PORT}/auth/google`, {
                code,
            });
            console.log(tokens);
            const userInfo = axios
                .get('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokens.data.access_token}` },
                })
                .then(
                    res => {
                        var data = res.data
                        console.log('data', data)
                        axios.post(`http://${process.env.REACT_APP_BACK_HOST}:${process.env.REACT_APP_BACK_PORT}/api/users/registerGoogle`, {
                            "username": data.name,
                            "email": data.email,
                        })
                            .then(response => {
                                localStorage.clear();
                                localStorage.setItem('email', response.data.email);
                                localStorage.setItem('username', response.data.username);
                                localStorage.setItem('accessToken', "gg");
                                localStorage.setItem('id', response.data.id);

                                window.location.reload();
                            })

                    }
                );

            // console.log(userInfo);
        },
        flow: 'auth-code',
    });

    return (
        <>
            <Button icon={<GoogleCircleFilled />} onClick={() => login()}>Continuer avec Google</Button>
        </>
    );
}

export default GoogleLoginButton;