export function formatTime(time: number) {
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time - hours * 3600) / 60);
  const seconds = time - hours * 3600 - minutes * 60;

  const hourStr = hours.toFixed(0).padStart(2, "0");
  const minuteStr = minutes.toFixed(0).padStart(2, "0");
  const secondStr = seconds.toFixed(0).padStart(2, "0");
  const list = [hourStr, minuteStr, secondStr];
  if (list[0] === "00") list.shift();
  return list.join(":");
}

export async function delay(time: number) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(""), time);
  });
}
