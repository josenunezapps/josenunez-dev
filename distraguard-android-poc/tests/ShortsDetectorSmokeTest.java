import com.josenunezapps.distraguard.shortsprobe.ShortsDetector;

public final class ShortsDetectorSmokeTest {
    public static void main(String[] args) {
        ShortsDetector.Signals home = new ShortsDetector.Signals();
        home.add("com.google.android.youtube:id/pivot_bar", "Shorts", "Shorts");
        check(!ShortsDetector.isShortsPlayer(home), "Home no debe bloquearse");

        ShortsDetector.Signals normal = new ShortsDetector.Signals();
        normal.add("com.google.android.youtube:id/watch_player", "Compartir", "Me gusta");
        check(!ShortsDetector.isShortsPlayer(normal), "Video normal no debe bloquearse");

        ShortsDetector.Signals reel = new ShortsDetector.Signals();
        reel.add("com.google.android.youtube:id/reel_player_page_container", null, null);
        check(ShortsDetector.isShortsPlayer(reel), "Reel debe detectarse");

        ShortsDetector.Signals ui = new ShortsDetector.Signals();
        ui.add(null, "Shorts", null);
        ui.add(null, "Remixar", "Comentarios");
        check(ShortsDetector.isShortsPlayer(ui), "Señales visuales deben detectarse");

        check(ShortsDetector.isShortsClick(null, "Shorts"), "Click Shorts debe detectarse");
        check(!ShortsDetector.isShortsClick("Suscribirse", null), "Click normal no debe detectarse");
        System.out.println("PASS: seis verificaciones del detector");
    }

    private static void check(boolean condition, String message) {
        if (!condition) throw new AssertionError(message);
    }
}
