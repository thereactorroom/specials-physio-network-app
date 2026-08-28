import Dashboard from "./Dashboard";
import CommunityView from "./CommunityView";
import { getParamCaseInsensitive } from "@/lib/urlParams";

export default function Home() {
  const viewParam = getParamCaseInsensitive("View");
  const viewValue = viewParam ? viewParam.toLowerCase() : null;

  // View=True → read-only dashboard: list business specials, preview only.
  if (viewValue === "true") {
    sessionStorage.setItem("app_view_mode", "true");
    return <Dashboard viewOnly />;
  }
  if (viewValue === "false") {
    sessionStorage.removeItem("app_view_mode");
  }

  const createParam = getParamCaseInsensitive("create");

  const createValue = createParam ? createParam.toLowerCase() : null;
  if (createValue === "true") {
    sessionStorage.setItem("app_create_mode", "true");
    return <Dashboard />;
  }
  if (createValue === "false") {
    sessionStorage.removeItem("app_create_mode");
    return <CommunityView />;
  }

  // No param: fall back to persisted mode so back-navigation from sub-pages
  // (create/history/preview) returns to the dashboard for business owners.
  if (sessionStorage.getItem("app_view_mode") === "true") {
    return <Dashboard viewOnly />;
  }
  if (sessionStorage.getItem("app_create_mode") === "true") {
    return <Dashboard />;
  }

  return <CommunityView />;
}