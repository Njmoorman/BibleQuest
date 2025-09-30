using Microsoft.Maui;
using Microsoft.Maui.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Components.WebView.Maui;  // ✅ needed for AddMauiBlazorWebView

namespace BibleQuestForKids
{
    public static class MauiProgram
    {
        public static MauiApp CreateMauiApp()
        {
            var builder = MauiApp.CreateBuilder();

            builder
                .UseMauiApp<App>()
                .ConfigureFonts(fonts =>
                {
                    fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
                    fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
                });

            // ✅ This is where the Blazor WebView service gets registered
            builder.Services.AddMauiBlazorWebView();

#if DEBUG
            builder.Services.AddBlazorWebViewDeveloperTools();
#endif

            return builder.Build();
        }
    }
}