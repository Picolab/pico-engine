const getBrightness = (color: string): number => {
  try {
    if (typeof color !== "string") {
      return 0;
    }
    let res = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color.trim());
    if (!res) {
      return 0;
    }
    let rgb = [
      parseInt(res[1] || "0", 16),
      parseInt(res[2] || "0", 16),
      parseInt(res[3] || "0", 16),
    ];
    const brightness = Math.round(
      (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000
    );
    return brightness;
  } catch (err) {
    return 0;
  }
};

export const titleColor = (color: string): string => {
  return getBrightness(color) > 135 ? "#000000" : "#ffffff";
};
