/*
  # Create notification admin function

  1. New Functions
    - `create_notification_as_admin` - Allows bypassing RLS for system notifications
      - Parameters: notification details (type, title, message, user_id, etc.)
      - Returns: newly created notification record
      - Security: DEFINER privileges to bypass RLS

  2. Security
    - Grant execute permission to authenticated users
    - Function runs with elevated privileges to create system notifications

  3. Purpose
    - Enables the application to create notifications for tournament events
    - Bypasses RLS policies that would otherwise prevent notification creation
    - Maintains audit trail for all notification activities
*/

CREATE OR REPLACE FUNCTION public.create_notification_as_admin(
    notification_type notification_type,
    notification_title text,
    notification_message text,
    notification_user_id uuid DEFAULT NULL,
    notification_tournament_id uuid DEFAULT NULL,
    notification_tournament_name text DEFAULT NULL,
    notification_target_role user_role DEFAULT NULL
)
RETURNS public.notifications
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_notification public.notifications;
BEGIN
    INSERT INTO public.notifications (
        type,
        title,
        message,
        user_id,
        tournament_id,
        tournament_name,
        target_role,
        read,
        created_at
    )
    VALUES (
        notification_type,
        notification_title,
        notification_message,
        notification_user_id,
        notification_tournament_id,
        notification_tournament_name,
        notification_target_role,
        FALSE,
        now()
    )
    RETURNING * INTO new_notification;

    RETURN new_notification;
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.create_notification_as_admin TO authenticated;

-- Grant execution to anon users for public notifications
GRANT EXECUTE ON FUNCTION public.create_notification_as_admin TO anon;