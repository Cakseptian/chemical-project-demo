"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { TeamActivity } from "../types";

export const useTeamActivities = () => {
    const [teamActivities, setTeamActivities] = useState<TeamActivity[]>([]);
    const [isLoadingTeam, setIsLoadingTeam] = useState(false);

    const fetchTeamActivities = async () => {
        setIsLoadingTeam(true);
        try {
            const { data, error } = await supabase
                .from("transactions")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(3);
            if (error) throw error;
            if (data) setTeamActivities(data as TeamActivity[]);
        } catch (err) {
            console.error("Gagal menarik aktivitas tim terbaru", err);
        } finally {
            setIsLoadingTeam(false);
        }
    };

    return { teamActivities, isLoadingTeam, fetchTeamActivities };
};