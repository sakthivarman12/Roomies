import { money } from "@/lib/format";
import { restrictionsOf } from "@/lib/access";
import { nowIso, uid } from "@/lib/utils";
import { mutate, notify, otherMemberIds, ServiceError } from "./context";
import type { FundService } from "./types";

export const localFundService: FundService = {
  contribute({ amount, method, note }) {
    return mutate(({ db, user, household }) => {
      if (!(amount > 0)) throw new ServiceError("Enter an amount greater than zero.");
      if (!restrictionsOf(db, user.id, household.id).seeFund) throw new ServiceError("You don't have access to the room fund.");
      const entry = { id: uid(), householdId: household.id, userId: user.id, kind: "contribution" as const, amount, method, note: note?.trim() || undefined, createdAt: nowIso() };
      db.fund.unshift(entry);
      const watchers = otherMemberIds(db, household.id, user.id).filter((id) => restrictionsOf(db, id, household.id).seeFund);
      notify(db, household.id, watchers, "fund", "Added to the room fund", `${user.name} put ${money(amount)} into the common fund`);
      return entry;
    });
  },
};
