import { Outlet } from "react-router";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { EpicsHeader } from "./header";

// Dronolab: Epics section

export default function EpicsLayout() {
  return (
    <>
      <AppHeader header={<EpicsHeader />} />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
