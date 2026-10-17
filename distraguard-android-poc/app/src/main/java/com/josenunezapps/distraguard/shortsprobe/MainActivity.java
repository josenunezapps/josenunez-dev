package com.josenunezapps.distraguard.shortsprobe;

import android.app.Activity;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.content.Intent;
import android.content.res.ColorStateList;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.provider.Settings;
import android.view.Gravity;
import android.view.View;
import android.view.WindowInsets;
import android.view.accessibility.AccessibilityManager;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.Switch;
import android.widget.TextView;
import android.widget.Toast;

import java.util.List;

/** Panel Android local para comprobar el bloqueo de Shorts. */
public final class MainActivity extends Activity {
    private static final int BG = 0xff08141b;
    private static final int CARD = 0xff122731;
    private static final int OUTLINE = 0xff294550;
    private static final int WHITE = 0xffeff9f9;
    private static final int MUTED = 0xffaabfc5;
    private static final int MINT = 0xff70e7c5;
    private static final int LILAC = 0xffb8afff;
    private static final int AMBER = 0xffffce8a;
    private FrameLayout root;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(BG);
        getWindow().setNavigationBarColor(BG);
        root = new FrameLayout(this);
        root.setBackgroundColor(BG);
        root.setOnApplyWindowInsetsListener((view, insets) -> {
            view.setPadding(0, insets.getSystemWindowInsetTop(),
                    0, insets.getSystemWindowInsetBottom());
            return insets;
        });
        setContentView(root);
        render();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (root != null) render();
    }

    private void render() {
        root.removeAllViews();
        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        scroll.setVerticalScrollBarEnabled(false);
        root.addView(scroll, new FrameLayout.LayoutParams(-1, -1));
        LinearLayout body = column(0);
        body.setPadding(dp(20), dp(24), dp(20), dp(36));
        scroll.addView(body, new ScrollView.LayoutParams(-1, -2));

        body.addView(text("DISTRA / GUARD       ANDROID LAB", 12, MINT, true));
        gap(body, 17);
        body.addView(text("YouTube sin\nShorts.", 38, WHITE, true));
        gap(body, 8);
        body.addView(text("Prueba 0.1 · Bloqueo en la app oficial", 14, MUTED, false));
        gap(body, 23);

        LinearLayout status = card();
        status.addView(text(statusTitle(), 22, isFullyActive() ? MINT : AMBER, true));
        gap(status, 8);
        status.addView(text(statusDescription(), 14, MUTED, false));
        body.addView(status);
        gap(body, 14);

        LinearLayout metrics = card();
        metrics.addView(text("RESULTADOS DE LA PRUEBA", 12, LILAC, true));
        gap(metrics, 15);
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.addView(metric(String.valueOf(Prefs.blocked(this)), "Salidas de Shorts"),
                new LinearLayout.LayoutParams(0, -2, 1));
        row.addView(metric(String.valueOf(Prefs.events(this)), "Señales de YouTube"),
                new LinearLayout.LayoutParams(0, -2, 1));
        metrics.addView(row);
        gap(metrics, 12);
        metrics.addView(text("Última detección: " + Prefs.lastSignal(this),
                12, MUTED, false));
        body.addView(metrics);
        gap(body, 14);

        if (Prefs.hasConsent(this)) showControls(body);
        else showDisclosure(body);

        gap(body, 14);
        LinearLayout info = card();
        info.addView(text("CÓMO PROBAR", 12, LILAC, true));
        gap(info, 10);
        info.addView(text("1. Autorizá el servicio.\n"
                + "2. Activá «Bloquear Shorts».\n"
                + "3. Abrí YouTube y tocá Shorts.\n"
                + "4. El prototipo intentará volver con Atrás.\n"
                + "5. Volvé y verificá los contadores.",
                14, WHITE, false));
        gap(info, 11);
        info.addView(text("Esta versión no garantiza reconocer todas las pantallas de Shorts. "
                + "YouTube puede cambiar sus controles. No hay bloqueo de canales o palabras.",
                12, MUTED, false));
        body.addView(info);
        gap(body, 17);

        Button youtube = button("Abrir YouTube para probar", false);
        youtube.setOnClickListener(v -> openYouTube());
        body.addView(youtube, matchWidth());
        gap(body, 14);
        TextView footer = text("DistraGuard · Prueba independiente · Sin conexión", 11, MUTED, false);
        footer.setGravity(Gravity.CENTER);
        body.addView(footer);
    }

    private void showDisclosure(LinearLayout body) {
        LinearLayout consentCard = card();
        consentCard.addView(text("PERMISO NECESARIO", 12, LILAC, true));
        gap(consentCard, 8);
        consentCard.addView(text("Uso de Accesibilidad", 21, WHITE, true));
        gap(consentCard, 12);
        consentCard.addView(text("DistraGuard leerá etiquetas y elementos visibles "
                + "únicamente dentro de la aplicación oficial de YouTube para detectar "
                + "cuándo ingresás a Shorts. Si lo detecta y activaste el bloqueo, "
                + "utilizará la acción Atrás del sistema.\n\n"
                + "No almacena títulos de videos, nombres de canales ni historial, "
                + "no toma capturas de pantalla y no comparte información. "
                + "Solo guarda contadores y el resultado de la última detección "
                + "en este teléfono.\n\n"
                + "Podés revocar esta autorización desde DistraGuard en cualquier momento.",
                14, MUTED, false));
        gap(consentCard, 13);
        CheckBox check = new CheckBox(this);
        check.setText("Leí y autorizo expresamente este uso de Accesibilidad.");
        check.setTextColor(WHITE);
        check.setTextSize(14);
        check.setButtonTintList(ColorStateList.valueOf(MINT));
        consentCard.addView(check);
        gap(consentCard, 12);
        Button authorize = button("Autorizar y abrir Accesibilidad", true);
        authorize.setEnabled(false);
        authorize.setAlpha(.45f);
        check.setOnCheckedChangeListener((b, checked) -> {
            authorize.setEnabled(checked);
            authorize.setAlpha(checked ? 1f : .45f);
        });
        authorize.setOnClickListener(v -> {
            if (!check.isChecked()) return;
            Prefs.grantConsent(this);
            Prefs.setEnabled(this, true);
            accessibilitySettings();
        });
        consentCard.addView(authorize, matchWidth());
        body.addView(consentCard);
    }

    private void showControls(LinearLayout body) {
        LinearLayout controls = card();
        controls.addView(text("CONTROL LOCAL", 12, LILAC, true));
        gap(controls, 14);
        LinearLayout row = new LinearLayout(this);
        row.setGravity(Gravity.CENTER_VERTICAL);
        LinearLayout heading = column(0);
        heading.addView(text("Bloquear Shorts", 18, WHITE, true));
        gap(heading, 3);
        heading.addView(text("Volver al detectar Shorts en YouTube", 12, MUTED, false));
        row.addView(heading, new LinearLayout.LayoutParams(0, -2, 1));
        Switch toggle = new Switch(this);
        toggle.setChecked(Prefs.isEnabled(this));
        toggle.setShowText(false);
        toggle.setThumbTintList(ColorStateList.valueOf(MINT));
        row.addView(toggle);
        toggle.setOnCheckedChangeListener((v, checked) -> {
            Prefs.setEnabled(this, checked);
            render();
        });
        controls.addView(row);
        gap(controls, 20);

        Button settings = button("Abrir ajustes de Accesibilidad", true);
        settings.setOnClickListener(v -> accessibilitySettings());
        controls.addView(settings, matchWidth());
        gap(controls, 9);

        Button refresh = button("Actualizar estado", false);
        refresh.setOnClickListener(v -> render());
        controls.addView(refresh, matchWidth());
        gap(controls, 9);

        Button revoke = button("Revocar autorización", false);
        revoke.setOnClickListener(v -> {
            Prefs.revokeConsent(this);
            toast("Autorización revocada: el servicio queda inactivo.");
            render();
        });
        controls.addView(revoke, matchWidth());
        body.addView(controls);
    }

    private boolean isFullyActive() {
        return Prefs.isEnabled(this) && accessibilityIsOn();
    }

    private String statusTitle() {
        if (!Prefs.hasConsent(this)) return "Esperando autorización";
        if (!Prefs.isEnabled(this)) return "Bloqueo pausado";
        if (!accessibilityIsOn()) return "Falta activar Accesibilidad";
        return "Protección en marcha";
    }

    private String statusDescription() {
        if (!Prefs.hasConsent(this)) return "Leé la explicación y autorizá el acceso.";
        if (!Prefs.isEnabled(this)) return "El interruptor está apagado; no se actuará.";
        if (!accessibilityIsOn())
            return "Entrá en Ajustes > Accesibilidad, buscá «DistraGuard — Bloqueo de Shorts» "
                    + "y activalo manualmente.";
        return "El servicio está habilitado. Abrí YouTube y comprobá si Shorts se detecta.";
    }

    private boolean accessibilityIsOn() {
        AccessibilityManager manager = (AccessibilityManager)
                getSystemService(ACCESSIBILITY_SERVICE);
        if (manager == null) return false;
        List<AccessibilityServiceInfo> enabled =
                manager.getEnabledAccessibilityServiceList(
                        AccessibilityServiceInfo.FEEDBACK_ALL_MASK);
        for (AccessibilityServiceInfo info : enabled) {
            if (info.getResolveInfo() == null
                    || info.getResolveInfo().serviceInfo == null) continue;
            android.content.pm.ServiceInfo service = info.getResolveInfo().serviceInfo;
            if (getPackageName().equals(service.packageName)
                    && ShortsGuardianService.class.getName().equals(service.name)) return true;
        }
        return false;
    }

    private void accessibilitySettings() {
        try {
            startActivity(new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS));
        } catch (Exception ex) {
            toast("No fue posible abrir los ajustes.");
        }
    }

    private void openYouTube() {
        try {
            Intent launch = getPackageManager()
                    .getLaunchIntentForPackage("com.google.android.youtube");
            if (launch == null) {
                toast("Instalá o habilitá YouTube para probar.");
                return;
            }
            startActivity(launch);
        } catch (Exception ex) {
            toast("No fue posible abrir YouTube.");
        }
    }

    private LinearLayout metric(String value, String caption) {
        LinearLayout col = column(0);
        col.addView(text(value, 32, MINT, true));
        gap(col, 4);
        col.addView(text(caption, 12, MUTED, false));
        return col;
    }

    private LinearLayout card() {
        LinearLayout v = column(dp(20));
        v.setBackground(rounded(CARD, OUTLINE, 23));
        return v;
    }

    private LinearLayout column(int padding) {
        LinearLayout v = new LinearLayout(this);
        v.setOrientation(LinearLayout.VERTICAL);
        v.setPadding(padding, padding, padding, padding);
        return v;
    }

    private TextView text(String message, int size, int color, boolean strong) {
        TextView t = new TextView(this);
        t.setText(message);
        t.setTextColor(color);
        t.setTextSize(size);
        t.setLineSpacing(dp(3), 1f);
        t.setTypeface(Typeface.create(strong ? "sans-serif-medium" : "sans-serif",
                Typeface.NORMAL));
        return t;
    }

    private Button button(String caption, boolean bright) {
        Button b = new Button(this);
        b.setText(caption);
        b.setTextSize(14);
        b.setAllCaps(false);
        b.setTextColor(bright ? BG : WHITE);
        b.setBackground(rounded(bright ? MINT : CARD, bright ? MINT : OUTLINE, 17));
        b.setMinHeight(dp(54));
        b.setPadding(dp(14), dp(12), dp(14), dp(12));
        return b;
    }

    private GradientDrawable rounded(int fill, int stroke, int radius) {
        GradientDrawable d = new GradientDrawable();
        d.setColor(fill);
        d.setCornerRadius(dp(radius));
        d.setStroke(dp(1), stroke);
        return d;
    }

    private LinearLayout.LayoutParams matchWidth() {
        return new LinearLayout.LayoutParams(-1, -2);
    }

    private void gap(LinearLayout box, int height) {
        box.addView(new View(this), new LinearLayout.LayoutParams(1, dp(height)));
    }

    private int dp(int n) {
        return Math.round(getResources().getDisplayMetrics().density * n);
    }

    private void toast(String msg) {
        Toast.makeText(this, msg, Toast.LENGTH_LONG).show();
    }
}
