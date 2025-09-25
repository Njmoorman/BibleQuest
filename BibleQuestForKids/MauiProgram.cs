using Microsoft.Maui;
using Microsoft.Maui.Controls;
using Microsoft.Maui.Controls.Hosting;
using Microsoft.Maui.Hosting;

#if IOS
using BibleQuestForKids.Platforms.iOS.Handlers;
#endif

namespace BibleQuestForKids;

public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();

        builder
            .UseMauiApp<App>();

#if IOS
        // Wire up the WKWebView handler override so local bundles work on both
        // TestFlight and App Store builds without additional entitlements.
        builder.ConfigureMauiHandlers(handlers =>
        {
            handlers.AddHandler<WebView, LocalWebViewHandler>();
        });
#endif

        return builder.Build();
    }
}
