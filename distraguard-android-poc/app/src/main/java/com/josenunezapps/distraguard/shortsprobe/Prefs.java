package com.josenunezapps.distraguard.shortsprobe;

import android.content.Context;
import android.content.SharedPreferences;

public final class Prefs {
    private static final String NAME = "distraguard_shorts_probe_v1";
    private static final String CONSENT = "consent";
    private static final String ENABLED = "shorts_enabled";
    private static final String BLOCKED = "shorts_blocked";
    private static final String EVENTS = "youtube_events";
    private static final String LAST_BLOCK = "last_block_at";
    private static final String LAST_SIGNAL = "last_signal";

    private Prefs() {}

    private static SharedPreferences prefs(Context context) {
        return context.getApplicationContext()
                .getSharedPreferences(NAME, Context.MODE_PRIVATE);
    }

    public static boolean hasConsent(Context context) {
        return prefs(context).getBoolean(CONSENT, false);
    }

    public static boolean isEnabled(Context context) {
        return hasConsent(context) && prefs(context).getBoolean(ENABLED, false);
    }

    public static void grantConsent(Context context) {
        prefs(context).edit().putBoolean(CONSENT, true).apply();
    }

    public static void revokeConsent(Context context) {
        prefs(context).edit()
                .putBoolean(CONSENT, false)
                .putBoolean(ENABLED, false).apply();
    }

    public static void setEnabled(Context context, boolean enabled) {
        prefs(context).edit().putBoolean(ENABLED, enabled && hasConsent(context)).apply();
    }

    public static int blocked(Context context) {
        return prefs(context).getInt(BLOCKED, 0);
    }

    public static int events(Context context) {
        return prefs(context).getInt(EVENTS, 0);
    }

    public static long lastBlockAt(Context context) {
        return prefs(context).getLong(LAST_BLOCK, 0L);
    }

    public static String lastSignal(Context context) {
        return prefs(context).getString(LAST_SIGNAL, "Sin detecciones");
    }

    public static void noteEvent(Context context) {
        SharedPreferences p = prefs(context);
        p.edit().putInt(EVENTS, Math.min(1000000, p.getInt(EVENTS, 0) + 1)).apply();
    }

    public static void noteBlock(Context context, String reason) {
        SharedPreferences p = prefs(context);
        p.edit()
            .putInt(BLOCKED, Math.min(1000000, p.getInt(BLOCKED, 0) + 1))
            .putLong(LAST_BLOCK, System.currentTimeMillis())
            .putString(LAST_SIGNAL, reason)
            .apply();
    }
}
