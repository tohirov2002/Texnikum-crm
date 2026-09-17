import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../src/theme';
import { selectRole } from '../../src/store/authSlice';

// ── Har rol uchun tab konfiguratsiyasi ────────────────────────────────────────
const TAB_CONFIG = {
  founder: [
    { name: 'founder/index',   icon: '📊', labelKey: 'dashboard'    },
    { name: 'founder/finance', icon: '💰', labelKey: 'income'       },
    { name: 'founder/hr',      icon: '👥', labelKey: 'employees'    },
    { name: 'settings',        icon: '⚙️',  labelKey: 'settings'    },
  ],
  director: [
    { name: 'director/index',      icon: '📊', labelKey: 'dashboard'   },
    { name: 'director/employees',  icon: '👥', labelKey: 'employees'   },
    { name: 'director/attendance', icon: '📅', labelKey: 'attendance'  },
    { name: 'director/payroll',    icon: '💳', labelKey: 'salary'      },
    { name: 'settings',            icon: '⚙️',  labelKey: 'settings'   },
  ],
  center_admin: [
    { name: 'admin/index',          icon: '📊', labelKey: 'dashboard'   },
    { name: 'admin/groups',         icon: '📚', labelKey: 'groups'      },
    { name: 'admin/students',       icon: '🎓', labelKey: 'students'    },
    { name: 'admin/live-attendance',icon: '📡', labelKey: 'attendance'  },
    { name: 'admin/payments',       icon: '💳', labelKey: 'payments'    },
  ],
  teacher: [
    { name: 'teacher/index',          icon: '📊', labelKey: 'dashboard'     },
    { name: 'teacher/groups',         icon: '📚', labelKey: 'my_groups'     },
    { name: 'teacher/lessons',        icon: '🎯', labelKey: 'lessons'       },
    { name: 'teacher/my-attendance',  icon: '📅', labelKey: 'my_attendance' },
    { name: 'settings',               icon: '⚙️',  labelKey: 'settings'     },
  ],
  student: [
    { name: 'student/index',      icon: '📊', labelKey: 'dashboard'   },
    { name: 'student/attendance', icon: '📅', labelKey: 'attendance'  },
    { name: 'student/grades',     icon: '📝', labelKey: 'lessons'     },
    { name: 'student/payments',   icon: '💳', labelKey: 'payments'    },
    { name: 'settings',           icon: '⚙️',  labelKey: 'settings'   },
  ],
  superadmin: [
    { name: 'founder/index',   icon: '📊', labelKey: 'dashboard' },
    { name: 'founder/finance', icon: '💰', labelKey: 'income'    },
    { name: 'founder/hr',      icon: '👥', labelKey: 'employees' },
    { name: 'settings',        icon: '⚙️',  labelKey: 'settings' },
  ],
};

// ── Barcha tab nomlari (Expo Router uchun) ────────────────────────────────────
const ALL_TABS = [
  'founder/index', 'founder/finance', 'founder/hr',
  'director/index', 'director/employees', 'director/attendance', 'director/payroll',
  'admin/index', 'admin/groups', 'admin/students', 'admin/live-attendance', 'admin/payments',
  'teacher/index', 'teacher/groups', 'teacher/lessons', 'teacher/my-attendance',
  'student/index', 'student/attendance', 'student/grades', 'student/payments',
  'settings',
];

export default function TabsLayout() {
  const role      = useSelector(selectRole) || 'student';
  const { t }     = useTranslation();
  const { colors, isDark } = useTheme();

  const tabs = TAB_CONFIG[role] || TAB_CONFIG.student;
  const tabNames = new Set(tabs.map(tb => tb.name));

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.navBg,
          borderTopColor:  colors.navBorder,
          borderTopWidth:  1,
          height:          60,
          paddingBottom:   8,
          paddingTop:      6,
        },
        tabBarActiveTintColor:   colors.navActive,
        tabBarInactiveTintColor: colors.navInactive,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
      }}
    >
      {ALL_TABS.map(tabName => {
        const cfg    = tabs.find(tb => tb.name === tabName);
        const hidden = !tabNames.has(tabName);
        return (
          <Tabs.Screen
            key={tabName}
            name={tabName}
            options={{
              href:  hidden ? null : undefined,
              title: cfg ? t(cfg.labelKey) : tabName,
              tabBarIcon: ({ focused }) => (
                <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{cfg?.icon || '•'}</Text>
              ),
            }}
          />
        );
      })}
    </Tabs>
  );
}
