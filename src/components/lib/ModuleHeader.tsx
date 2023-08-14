import React, {CSSProperties, FC} from 'react';
import { Button, Input } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { DesktopOrTabletScreen, MobileScreen } from './Responsive';
import { buildMobileButtons } from "./Utils";
import withStyles, {jss, WithStylesProps} from "react-jss";

const { Search } = Input;


const styles = {
    backButton: {
        border: 0,
        background: "transparent",
        padding: 0,
        lineHeight: 'inherit',
        display: 'inline-block',
    },
    'mod-title': {

    },
    'sub-title': {
        fontSize: 'small',
        textOverflow: 'ellipsis',
        position: 'relative',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
    },
    '@media (min-width: 767px)': {
        'mod-title': {
            marginBottom: 0,
            overflow: "hidden"
        }
    },
    '@media (max-width: 767px)': {
        'mod-title': {
            marginBottom: 0,
            marginLeft: '8px'
        }
    },
    'mod-buttons': {
        '& button': {
            marginLeft: '8px',
            marginTop: '4px',
            marginBottom: '4px'
        },
        '& a': {
            marginLeft: '8px',
            marginTop: '4px',
            marginBottom: '4px'
        }
    },
}



interface ComponentProps extends WithStylesProps<typeof styles>{
    search?: boolean,
    showBackButton?: boolean,
    showButtonsInMobile?: boolean,
    title: string | React.ReactNode | JSX.Element,
    subTitle?: string | React.ReactNode | JSX.Element,
    tooltip?: string,
    buttons?: JSX.Element[] | undefined,
    children?: React.ReactNode,
    className?: string | undefined,
    style?: CSSProperties | undefined,
    onSearch?: (value: any) => void
}


const ModuleHeader: FC<ComponentProps> = ({search= true , showButtonsInMobile = true,
                                              showBackButton = true, title,
                                              subTitle, tooltip, classes,
                                              buttons, onSearch,
                                              className, style, children}) => {


    return (
        <div className={"mod-header "+ (className ? className : "")} style={style}>
            {showBackButton &&
                <Button
                    icon={<ArrowLeftOutlined />}
                    className={classes.backButton}
                    onClick={() => window.history.back()}
                />
            }
            <h2 className={classes['mod-title']}>{title}{subTitle?<div className={classes['sub-title']} title={tooltip ?? subTitle as string | undefined}>{subTitle}</div>:""}</h2>
            <div style={{flexGrow: 1}}></div>
            <div>{children}</div>
            {search ? <Search placeholder="Поиск..." allowClear onSearch={onSearch} style={{ width: 200, marginLeft: 8 }} /> : null}
            <DesktopOrTabletScreen>
                <div className={"mod-buttons " + classes['mod-buttons']}>
                    {buttons}
                </div>
            </DesktopOrTabletScreen>
            {showButtonsInMobile &&
                <MobileScreen>
                    <div className={"mod-buttons " + classes['mod-buttons']}>
                        {buildMobileButtons(buttons, true)}
                    </div>
                </MobileScreen>
            }
        </div>
    );
}


export default withStyles(styles)(ModuleHeader);
