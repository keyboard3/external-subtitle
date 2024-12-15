import { matchConfig } from "./config";

test("match config", async () => {
  const config = await matchConfig([{
    match: "*",
    enable: false,
    floatBall: { enable: false, top: "0", right: "0" },
  }, {
    match: "google.com",
    enable: false,
  }, {
    match: "www.baidu.com",
    floatBall: { enable: true, top: "0", right: "0" },
  }], "www.baidu.com");
  expect(config.enable).toBe(false);
  expect(config.floatBall).toStrictEqual({
    enable: true,
    top: "0",
    right: "0",
  });
});
