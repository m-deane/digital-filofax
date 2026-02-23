"use client";

import React, { useEffect, useRef } from "react";
import { api } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import Link from "next/link";

export default function AcceptInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const unwrappedParams = React.use(params);
  const hasTriggered = useRef(false);

  const acceptMutation = api.collaboration.acceptInvite.useMutation();

  useEffect(() => {
    if (hasTriggered.current) return;
    hasTriggered.current = true;
    acceptMutation.mutate({ token: unwrappedParams.token });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unwrappedParams.token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>
            {acceptMutation.isPending && "Accepting invite..."}
            {acceptMutation.isSuccess && "You've joined the list!"}
            {acceptMutation.isError && "Unable to accept invite"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {acceptMutation.isPending && (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          )}
          {acceptMutation.isSuccess && (
            <>
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="text-sm text-muted-foreground text-center">
                You now have access to the shared list.
              </p>
              <Button asChild>
                <Link href="/dashboard/shared">Go to Shared Lists</Link>
              </Button>
            </>
          )}
          {acceptMutation.isError && (
            <>
              <XCircle className="h-12 w-12 text-destructive" />
              <p className="text-sm text-muted-foreground text-center">
                {acceptMutation.error.message}
              </p>
              <Button asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
