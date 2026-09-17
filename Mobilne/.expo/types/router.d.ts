/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(auth)` | `/(auth)/login` | `/(onboarding)` | `/(onboarding)/` | `/(tabs)` | `/(tabs)/admin` | `/(tabs)/admin/groups` | `/(tabs)/admin/live-attendance` | `/(tabs)/admin/payments` | `/(tabs)/admin/students` | `/(tabs)/director` | `/(tabs)/director/attendance` | `/(tabs)/director/employees` | `/(tabs)/director/payroll` | `/(tabs)/founder` | `/(tabs)/founder/finance` | `/(tabs)/founder/hr` | `/(tabs)/settings` | `/(tabs)/student` | `/(tabs)/student/attendance` | `/(tabs)/student/grades` | `/(tabs)/student/payments` | `/(tabs)/teacher` | `/(tabs)/teacher/groups` | `/(tabs)/teacher/lessons` | `/(tabs)/teacher/my-attendance` | `/_sitemap` | `/admin` | `/admin/groups` | `/admin/live-attendance` | `/admin/payments` | `/admin/students` | `/director` | `/director/attendance` | `/director/employees` | `/director/payroll` | `/founder` | `/founder/finance` | `/founder/hr` | `/login` | `/settings` | `/student` | `/student/attendance` | `/student/grades` | `/student/payments` | `/teacher` | `/teacher/groups` | `/teacher/lessons` | `/teacher/my-attendance`;
      DynamicRoutes: never;
      DynamicRouteTemplate: never;
    }
  }
}
