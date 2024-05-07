import React from 'react';
import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';

const ErrorPage = () => {

    const navigate = useNavigate();

    return (
        <Result
            status="404"
            title="404"
            subTitle="Désolé, la page que vous essaye de visiter n'existe pas ou plus"
            extra={<Button type="primary" onClick={() => navigate('/')}>Retourner à l'accueil</Button>}
            className='error_page'
        />
    );
};

export default ErrorPage;