export const parseTime = (timeStr: string) => {
  // validate format: "10:30 AM"
  if (!timeStr.match(/^\d{1,2}:\d{2} (AM|PM)$/)) {
    return {
      success: false,
      message: "Invalid time format (use HH:mm AM/PM)",
    };
  }

  const [time, modifier] = timeStr.split(" ");
  let [hours = 0, minutes = 0] = time?.split(":").map(Number) || [];

  // convert to 24-hour format
  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  return { hours, minutes };
};
