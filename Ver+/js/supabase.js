import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://xruanuxvjkfkgizqtmpm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhydWFudXh2amtma2dpenF0bXBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MDQ0MzcsImV4cCI6MjA5NjE4MDQzN30.dlbRpKv6i_L4V_4aH0Ci-c2vFKUTHDlCw6fjgxk-rdY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);