import { useMediaQuery } from 'react-responsive'

export const Desktop = ({ children }: any) => {
  const isDesktop = useMediaQuery({query:"(min-width: 992px) or (min-height: 421px)" })
  return isDesktop ? children : null
}

export const Tablet = ({ children }: any) => {
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 991 })
  return isTablet ? children : null
}

export const MobileScreen = ({ children }: any) => {
  const isMobile = useMediaQuery({query:"(max-width:767px) or (max-height:420px)"})
  return isMobile ? children : null
}

export const DesktopOrTabletScreen = ({ children }: any) => {
  const isNotMobile = useMediaQuery({ minWidth: 768 })
  return isNotMobile ? children : null
}

let _mobileFlag = true;

/**
 * Флаг для доступа не из компонентиов. Определяется в App.js
 * @returns
 */
export const isMobile = ()=>_mobileFlag;

export const setMobile = (flag: boolean)=>{
    _mobileFlag=flag;
};


export const responsiveMobileColumn=()=>['md']
