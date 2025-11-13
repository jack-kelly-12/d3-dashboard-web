import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Database,
  LineChart,
  Binoculars,
  ChevronLeft,
  ChevronRight,
  Activity,
  LogOut,
  LogIn,
  UserPlus,
  Menu,
  X,
  CalendarCheck,
  Trophy,
  User2,
  User,
} from "lucide-react";
import AuthManager from "../managers/AuthManager";
import FeatureFlagManager from "../managers/FeatureFlagManager";
import GlobalPlayerSearch from "./GlobalPlayerSearch";


const MenuItem = ({
  icon: Icon,
  to,
  children,
  isActive,
  collapsed,
  mobileOpen,
}) => (
  <Link
    to={to}
    className={`group flex items-center h-10 px-3 rounded-lg transition-all duration-200 ${
      isActive
        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
        : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
    }`}
  >
    <Icon
      className={`w-4 h-4 transition-transform duration-200 ${
        collapsed && !mobileOpen ? "mx-auto" : ""
      } ${isActive ? "" : "group-hover:scale-110"}`}
      strokeWidth={isActive ? 2 : 1.5}
    />
    {(!collapsed || mobileOpen) && (
      <span className="ml-2 text-sm font-medium tracking-wide">{children}</span>
    )}
  </Link>
);

const UserSection = ({
  user,
  onSignOut,
  collapsed,
  mobileOpen,
}) => {
  const getMemberAppreciation = (creationTime) => {
    if (!creationTime) return { color: 'gray', accent: 'border-gray-200', memberSince: null };
    
    const joinDate = new Date(creationTime);
    const now = new Date();
    const monthsSinceJoin = (now.getFullYear() - joinDate.getFullYear()) * 12 + (now.getMonth() - joinDate.getMonth());
    
    const options = { 
      year: 'numeric', 
      month: 'long'
    };
    const memberSince = joinDate.toLocaleDateString('en-US', options);
    
    if (monthsSinceJoin >= 12) {
      return { color: 'purple', accent: 'border-purple-300', memberSince };
    } else if (monthsSinceJoin >= 6) {
      return { color: 'blue', accent: 'border-blue-300', memberSince };
    } else if (monthsSinceJoin >= 3) {
      return { color: 'green', accent: 'border-green-300', memberSince };
    } else {
      return { color: 'gray', accent: 'border-gray-200', memberSince };
    }
  };

  const memberAppreciation = user?.metadata?.creationTime ? getMemberAppreciation(user.metadata.creationTime) : { color: 'gray', accent: 'border-gray-200' };

  return (
    <div className="w-full space-y-2">
    <div
      className={`flex items-center min-h-12 px-3 py-2 rounded-lg bg-gray-50 text-gray-700 border-l-4 ${memberAppreciation.accent} ${
        collapsed && !mobileOpen ? "justify-center" : ""
      }`}
    >
      <User2 className="w-4 h-4" strokeWidth={1.5} />
      {(!collapsed || mobileOpen) && (
        <div className="ml-2 overflow-hidden flex-1">
          <div className="text-sm font-medium truncate">
            {user?.email || "Anonymous"}
          </div>
          {memberAppreciation.memberSince && (
            <div className="text-xs text-gray-500">
              Member since {memberAppreciation.memberSince}
            </div>
          )}
        </div>
      )}
    </div>


      <button
        onClick={onSignOut}
        className={`w-full flex items-center h-10 px-3 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all duration-200 ${
          collapsed && !mobileOpen ? "justify-center" : ""
        }`}
      >
        <LogOut className="w-4 h-4" strokeWidth={1.5} />
        {(!collapsed || mobileOpen) && (
          <span className="ml-2 text-sm font-medium">Sign Out</span>
        )}
      </button>
    </div>
  );
};

const AuthButtons = ({ collapsed, mobileOpen }) => (
  <div className="space-y-2">
    <Link
      to="/signin"
      className={`w-full flex items-center h-10 px-3 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-all duration-200 ${
        collapsed && !mobileOpen ? "justify-center" : ""
      }`}
    >
      <LogIn className="w-4 h-4" strokeWidth={1.5} />
      {(!collapsed || mobileOpen) && (
        <span className="ml-2 text-sm font-medium">Sign In</span>
      )}
    </Link>
    <Link
      to="/signin?signup=true"
      className={`w-full flex items-center h-10 px-3 text-green-600 hover:bg-green-50 hover:text-green-700 rounded-lg transition-all duration-200 ${
        collapsed && !mobileOpen ? "justify-center" : ""
      }`}
    >
      <UserPlus className="w-4 h-4" strokeWidth={1.5} />
      {(!collapsed || mobileOpen) && (
        <span className="ml-2 text-sm font-medium">Create Account</span>
      )}
    </Link>
  </div>
);

const MobileMenuButton = ({ mobileOpen, setMobileOpen }) => (
  <button
    onClick={() => setMobileOpen(!mobileOpen)}
    className="lg:hidden fixed top-4 right-4 z-50 p-3 rounded-xl bg-white shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-200"
  >
    {mobileOpen ? (
      <X className="w-6 h-6 text-gray-600" />
    ) : (
      <Menu className="w-6 h-6 text-gray-600" />
    )}
  </button>
);

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    isAnonymous: false,
  });
  const [hasRecruitingAccess, setHasRecruitingAccess] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribeAuth = AuthManager.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      setAuthState({
        isAuthenticated: !!currentUser,
        isAnonymous: currentUser?.isAnonymous || false,
      });

      if (currentUser) {
        const access = await FeatureFlagManager.hasAccessToFeature("recruiting");
        setHasRecruitingAccess(access);
      } else {
        setHasRecruitingAccess(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const handleSignOut = async () => {
    const result = await AuthManager.signOut();
    if (result.success) {
      navigate("/signin");
    }
  };

  const isActiveRoute = (path) => {
    if (path === "/" && location.pathname === "/") {
      return true;
    }

    if (path === "/") return false;

    const currentPath = location.pathname;
    return (
      currentPath === path ||
      currentPath.startsWith(`${path}/`) ||
      currentPath.startsWith(`${path}?`)
    );
  };

  const navigationItems = [
    { icon: Home, path: "/", label: "Home" },
    { icon: Database, path: "/data", label: "Data" },
    { icon: LineChart, path: "/charting", label: "Charting" },
    { icon: Binoculars, path: "/scouting", label: "Scouting" },
    { icon: User, path: "/recruiting", label: "Recruiting", requiresFeatureFlag: "recruiting" },
    { icon: Activity, path: "/guts", label: "Guts" },
    { icon: Trophy, path: "/leaderboards", label: "Leaderboards" },
    { icon: CalendarCheck, path: "/scoreboard", label: "Scoreboard" },
  ].filter((item) => {
    if (item.requiresFeatureFlag === "recruiting") {
      return hasRecruitingAccess;
    }
    return true;
  });

  const sidebarClasses = `
    ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
    ${collapsed && !mobileOpen ? "w-20" : "w-64"}
    lg:translate-x-0
    fixed inset-y-0 left-0 z-40
    transition-all duration-300 
    border-r border-gray-200 
    bg-white flex flex-col
    lg:relative
  `;

  return (
    <>
      <MobileMenuButton mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className={sidebarClasses}>
        <div className="h-16 flex items-center justify-center border-b border-gray-200">
          {collapsed && !mobileOpen ? (
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-xl">D3</span>
            </div>
          ) : (
            <div className="px-4 flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-xl">D3</span>
              </div>
              <span className="font-semibold text-gray-800 text-lg">
                Dashboard
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="mb-4">
            <GlobalPlayerSearch collapsed={collapsed && !mobileOpen} />
          </div>
          {navigationItems.map((item) => (
            <MenuItem
              key={item.path}
              icon={item.icon}
              to={item.path}
              isActive={isActiveRoute(item.path)}
              collapsed={collapsed}
              mobileOpen={mobileOpen}
            >
              {item.label}
            </MenuItem>
          ))}
        </div>

        <div className="border-t border-gray-200 p-3 space-y-2">
          {authState.isAuthenticated && !authState.isAnonymous ? (
            <UserSection
              user={user}
              onSignOut={handleSignOut}
              collapsed={collapsed}
              mobileOpen={mobileOpen}
              isLoading={false}
            />
          ) : (
            <AuthButtons collapsed={collapsed} mobileOpen={mobileOpen} />
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`hidden lg:flex w-full items-center h-10 px-3 text-gray-500 hover:bg-gray-100 hover:text-gray-700 rounded-lg transition-all duration-200 ${
              collapsed && !mobileOpen ? "justify-center" : ""
            }`}
          >
            {collapsed && !mobileOpen ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="ml-2 text-sm font-medium">Collapse</span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
