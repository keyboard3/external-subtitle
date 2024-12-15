import { translateServicesConfigs } from "../background/services";
import { delay } from "../utils/time";

interface TranslateTask {
  args: TranslateArgs;
  resolve: (value: string) => void;
  reject: (reason?: any) => void;
}

let seriesMap: { [key in TranslateService]: number } = {
  "google": 0,
  "bing": 0,
};
export async function translate(
  service: TranslateService,
  args: TranslateArgs,
) {
  const serviceConfig = translateServicesConfigs[service];
  if (!seriesMap[service]) {
    seriesMap[service] = serviceConfig.rateOption.series;
  }
  return new Promise((resolve, reject) => {
    pushQueue(serviceConfig, {
      args,
      resolve,
      reject,
    });
  });
}

//记录当前rpm周期内的执行的任务舒朗
let taskCalls: number[] = [];
//记录待翻译的任务数量
let taskQueue: TranslateTask[] = [];
//记录批量翻译的任务数量
let taskGroup: TranslateTask[] = [];
let taskGroupTimer: any;
async function pushQueue(
  serviceConfig: TranslationServiceConfig,
  task?: TranslateTask,
) {
  if (!task) return;

  const rateOption = serviceConfig.rateOption;
  let series = seriesMap[serviceConfig.serviceKey];
  if (series <= 0) {
    // console.log("并发不够 进入队列", task);
    taskQueue.push(task);
    return;
  }
  const firstTime = taskCalls[0] || Date.now();
  const diffTime = 60 * 1000 - (Date.now() - firstTime);
  if (taskCalls.length >= rateOption.rpm) {
    // console.log("rpm 超出", taskCalls);
    taskCalls = [];
    if (diffTime > 0) {
      // console.log(" 延时下一个任务", diffTime);
      await delay(diffTime);
    }
  } else if (diffTime < 0) {
    taskCalls = [];
  }

  // series--;
  // taskCalls.push(Date.now());
  // console.log("-----请求任务", task.args, taskQueue.length);
  planTranslateTask(task);

  async function planTranslateTask(task: TranslateTask) {
    taskGroup.push(task);
    clearTimeout(taskGroupTimer);
    taskGroupTimer = setTimeout(() => {
      toTranslateTaskGroup();
    }, 0);
    if (taskGroup.length >= rateOption.group) {
      clearTimeout(taskGroupTimer);
      toTranslateTaskGroup();
    }
  }
  async function toTranslateTaskGroup() {
    if (!taskGroup.length) return;

    series--;
    taskCalls.push(Date.now());
    const curTaskGroup = taskGroup.slice();
    taskGroup = [];

    const textList = curTaskGroup.map((item) => item.args.text);
    const args = curTaskGroup[0]?.args;
    try {
      const results = await serviceConfig.translateList(
        textList,
        args.from,
        args.to,
        rateOption.timeout,
      );
      for (let i = 0; i < results.length; i++) {
        curTaskGroup[i].resolve(results[i]);
      }
    } catch (err) {
      for (let i = 0; i < curTaskGroup.length; i++) {
        curTaskGroup[i].reject(err);
      }
    } finally {
      if (!taskQueue.length) {
        // console.log("回调回来无任务或者被清空");
        return;
      }
      // console.log("----任务完成", series, taskQueue.length);
      series++;
      for (let i = 0; i < rateOption.group; i++) {
        const nextTask = taskQueue.shift();
        if (!nextTask) return;
        planTranslateTask(nextTask);
      }
    }
  }
}

export function cancelQueue() {
  taskQueue.forEach((task) => {
    task.reject("cancel");
  });
  taskGroup.forEach((task) => {
    task.reject("cancel");
  });
  seriesMap = {} as any;
  clearTimeout(taskGroupTimer);
  taskQueue = [];
  taskCalls = [];
  taskGroup = [];
}
