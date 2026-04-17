import { useRouter } from "expo-router";

import { EmptyState } from "@/components/empty-state";
import { Screen } from "@/components/screen";

export default function NotFoundRoute() {
  const router = useRouter();

  return (
    <Screen
      contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
      footer={null}
    >
      <EmptyState
        title="Screen not found"
        description="The route you opened does not exist in this MVP build."
        actionLabel="Go home"
        onActionPress={() => router.replace("/image")}
      />
    </Screen>
  );
}
