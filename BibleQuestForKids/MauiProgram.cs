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
        builder.ConfigureMauiHandlers(handlers =>
        {
            handlers.AddHandler(typeof(WebView), typeof(LocalFileWebViewHandler));
        });
#endif

        return builder.Build();
    }
}
