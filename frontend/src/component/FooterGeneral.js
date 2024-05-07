import React from 'react';
import { Layout, Typography } from 'antd';
const { Title, Text } = Typography;

const { Footer } = Layout;

const FooterGeneral = () => {
    return (
        <>
            <Footer style={{ textAlign: 'center', position: 'relative' }}>
                <Text>🐓🇫🇷 CoqEnVoyage ©{new Date().getFullYear()} Created by M3F1 Team </Text>
            </Footer>
        </>
    );
};

export default FooterGeneral;