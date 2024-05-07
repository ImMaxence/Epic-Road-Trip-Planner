import React from 'react';
import { EditOutlined, EllipsisOutlined, SettingOutlined, LinkedinFilled, HeartOutlined, GithubFilled } from '@ant-design/icons';
import { Avatar, Card, Button, Tooltip, Typography } from 'antd';
const { Meta } = Card;
const { Title, Paragraph } = Typography;

const Contributor = ({ name, color, image, description, social1, social2 }) => {
    return (
        <>
            <div className="card_container_cont">
                <Card
                    hoverable
                    className='card'
                    cover={
                        <>
                            <div className={`color ${color}`}>
                                <Avatar src={`${image}`} className='avatar' />
                            </div>

                        </>
                    }
                    actions={[
                        <Tooltip title="Linkedin">
                            <Button type="text" icon={<LinkedinFilled />} style={{ paddingTop: "8px" }} size='large' onClick={() => window.open(`${social1}`, "_blank")} />
                        </Tooltip>,
                        <Tooltip title="Github">
                            <Button type="text" icon={<GithubFilled />} style={{ paddingTop: "8px" }} size='large' onClick={() => window.open(`${social2}`, "_blank")} />
                        </Tooltip>
                    ]}
                >
                    <div className="content_cont">
                        <Title level={3} className='title'>{name}</Title>
                        <Paragraph className='para'>{description}</Paragraph>
                    </div>
                </Card>
            </div>
        </>
    );
};

export default Contributor;