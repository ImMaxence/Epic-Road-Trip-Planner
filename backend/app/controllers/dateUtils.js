exports.getCurrentDate = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0'); // January is 0!
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
};

exports.getNextWeekDate = () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const day = String(nextWeek.getDate()).padStart(2, '0');
    const month = String(nextWeek.getMonth() + 1).padStart(2, '0'); // January is 0!
    const year = nextWeek.getFullYear();
    return `${day}/${month}/${year}`;
};
