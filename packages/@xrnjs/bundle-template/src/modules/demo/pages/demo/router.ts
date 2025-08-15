import NavigationDemo from "./navigation";
import Demo from ".";

export enum ROUTES {
    Demo = 'demo',
    NavigationDemo = 'NavigationDemo',
}
export const DemoRouter = [
  {
    path: ROUTES.Demo,
    component: Demo,
  },
  {
    path: ROUTES.NavigationDemo,
    component: NavigationDemo,
  }
];


