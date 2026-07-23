"use client";

import dynamic from "next/dynamic";


const PantoneColorPicker = dynamic(() => import("./Pantone"), {
  ssr: false,
});

export default PantoneColorPicker;