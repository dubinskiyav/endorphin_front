/**
 * (c) https://stackoverflow.com/users/254313/david
 */
 import { useState, useEffect } from 'react';

 export default function useLongPress(callback = (value?: any) => { }, ms = 300) {
     const [startLongPress, setStartLongPress] = useState(false);
     const [state] = useState<any>({});

     useEffect(() => {
         let timerId: any;
         if (startLongPress) {
             timerId = setTimeout(()=>callback(state.event), ms);
         } else {
             clearTimeout(timerId);
         }

         return () => {
             clearTimeout(timerId);
         };
     }, [callback, ms, startLongPress]);

     return {
         onMouseDown: (ev: any) => {state.event=ev; setStartLongPress(true)},
         onMouseUp: () => setStartLongPress(false),
         onMouseLeave: () => setStartLongPress(false),
         onTouchStart: (ev: any) => {state.event=ev; setStartLongPress(true)},
         onTouchEnd: () => setStartLongPress(false),
     };
 }
