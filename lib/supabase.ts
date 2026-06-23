import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client with service role (for admin operations)
export const createServerSupabaseClient = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          password_hash: string;
          device_id: string | null;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["users"]["Row"],
          "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };
      departments: {
        Row: {
          id: string;
          name: string;
          name_am: string;
          name_om: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
        };
      };
      exams: {
        Row: {
          id: string;
          department_id: string;
          year: number;
          title: string;
          is_free: boolean;
          is_active: boolean;
          created_at: string;
        };
      };
      questions: {
        Row: {
          id: string;
          exam_id: string;
          question_number: number;
          question_text: string;
          option_a: string;
          option_b: string;
          option_c: string;
          option_d: string;
          correct_answer: string;
          explanation: string | null;
          created_at: string;
        };
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          department_id: string;
          amount: number;
          screenshot_url: string | null;
          status: "pending" | "approved" | "rejected";
          telegram_sent: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      user_department_access: {
        Row: {
          id: string;
          user_id: string;
          department_id: string;
          granted_at: string;
        };
      };
      exam_results: {
        Row: {
          id: string;
          user_id: string;
          exam_id: string;
          score: number;
          total_questions: number;
          answers: Record<string, string>;
          completed_at: string;
        };
      };
      app_settings: {
        Row: {
          id: string;
          key: string;
          value: string;
          updated_at: string;
        };
      };
    };
  };
};
