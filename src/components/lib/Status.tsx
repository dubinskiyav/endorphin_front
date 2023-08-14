import withStyles, {WithStylesProps} from "react-jss";
import {FC} from "react";



// JSS. Стили компонента
const styles = {
    status: {
        maxHeight: '16px'
    }

}

// спецификация пропсов
interface ComponentProps extends WithStylesProps<typeof styles> {
    color: any
}

const Status: FC<ComponentProps> = ({color, classes}) => {
    // Сгенерируем id для градиента, иначе он будет неуникальным и не получится нарисовать несколько иконок разного цвета
    const gradientId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    return (
        <svg className={classes.status} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient gradientUnits="userSpaceOnUse" cx="24" cy="24" r="24" id={"RadialGradient" + gradientId} spreadMethod="pad">
                    <stop offset="0" stopColor="white" />
                    <stop offset="1" stopColor={color} />
                </radialGradient>
            </defs>
            <circle fill={"url(#RadialGradient" + gradientId + ")"} cx="32" cy="32" r="32" />
        </svg>
    )
};

export default withStyles(styles)(Status)
