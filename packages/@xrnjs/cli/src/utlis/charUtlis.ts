function capitalizeFirstLetter(str: string) {
    // 将字符串的第一个字符转换为大写
    return str.charAt(0).toUpperCase() + str.slice(1);
}


export { capitalizeFirstLetter }