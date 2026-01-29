"use client";

import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function EmailOptInDialog() {
  const { isAuthenticated } = useConvexAuth();
  const prefs = useQuery(
    api.userPreferences.getEmailOptInStatus,
    isAuthenticated ? {} : "skip"
  );
  const setEmailOptIn = useMutation(api.userPreferences.setEmailOptIn);
  const markShown = useMutation(api.userPreferences.markEmailOptInShown);

  const isOpen = isAuthenticated && prefs != null && !prefs.emailOptInShown;

  const handleOptIn = async () => {
    await setEmailOptIn({ optIn: true });
  };

  const handleDismiss = async () => {
    await markShown();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleDismiss(); }}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        {/* Decorative header band */}
        <div className="bg-gradient-to-br from-[hsl(222.2,47.4%,11.2%)] to-[hsl(222.2,47.4%,22%)] px-8 pt-10 pb-8 text-white">
          <div className="flex items-center gap-3 mb-3">
            <svg className="w-8 h-8 text-[hsl(48,96%,53%)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            <DialogTitle className="text-2xl font-bold text-white">
              Stay in the loop
            </DialogTitle>
          </div>
          <DialogDescription className="text-slate-200 text-base leading-relaxed">
            I occasionally send emails when I add new tools or ship something interesting. Want in?
          </DialogDescription>
        </div>

        {/* Body */}
        <div className="px-8 py-8 space-y-6">
          <ul className="space-y-4 text-base text-slate-700">
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 mt-0.5 text-[hsl(48,96%,43%)] shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
              Hear about new tools and map updates
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 mt-0.5 text-[hsl(48,96%,43%)] shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
              Rarely sent, never spammy
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 mt-0.5 text-[hsl(48,96%,43%)] shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
              You can turn it off anytime in settings
            </li>
          </ul>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <Button
              variant="ghost"
              className="text-slate-600 hover:text-slate-800 h-11 text-base"
              onClick={handleDismiss}
            >
              No thanks
            </Button>
            <Button
              className="flex-1 bg-[hsl(222.2,47.4%,11.2%)] hover:bg-[hsl(222.2,47.4%,18%)] text-white h-11 text-base"
              onClick={handleOptIn}
            >
              Yes, keep me updated
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
