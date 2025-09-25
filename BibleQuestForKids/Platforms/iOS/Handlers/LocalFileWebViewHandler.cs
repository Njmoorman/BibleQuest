#if IOS
using System;
using CoreGraphics;
using Foundation;
using Microsoft.Maui;
using Microsoft.Maui.Controls;
using Microsoft.Maui.Handlers;
using WebKit;

namespace BibleQuestForKids.Platforms.iOS.Handlers;

/// <summary>
/// Ensures WKWebView can serve bundled Vite assets via file:// URLs with read access
/// across TestFlight and App Store distributions.
/// </summary>
public sealed class LocalFileWebViewHandler : WebViewHandler
{
    private static readonly NSString AllowFileAccessKey = new("allowFileAccessFromFileURLs");
    private static readonly NSString AllowUniversalFileAccessKey = new("allowUniversalAccessFromFileURLs");

    private static readonly PropertyMapper<IWebView, LocalFileWebViewHandler> LocalMapper = new(WebViewHandler.Mapper);
    private static readonly CommandMapper<IWebView, LocalFileWebViewHandler> LocalCommandMapper = new(WebViewHandler.CommandMapper);

    static LocalFileWebViewHandler()
    {
        // Ensure bundled Vite assets resolve correctly when navigating to file:// URLs.
        LocalMapper.AppendToMapping(nameof(IWebView.Source), MapSource);
    }

    public LocalFileWebViewHandler()
        : base(LocalMapper, LocalCommandMapper)
    {
    }

    protected override WKWebView CreatePlatformView()
    {
        var configuration = new WKWebViewConfiguration();

        TryEnableLegacyFileSchemeAccess(configuration);

        return new WKWebView(CGRect.Empty, configuration);
    }

    private static void TryEnableLegacyFileSchemeAccess(WKWebViewConfiguration configuration)
    {
        // iOS 18 throws when setting the private allowFileAccess* keys. Swallow the exception so the
        // app keeps working while continuing to opt-in on older OS releases that still honour them.
        try
        {
            configuration.SetValueForKey(NSNumber.FromBoolean(true), AllowFileAccessKey);
            configuration.SetValueForKey(NSNumber.FromBoolean(true), AllowUniversalFileAccessKey);
        }
        catch (NSUnknownKeyException)
        {
            // The keys were removed by Apple; rely on the platform defaults.
        }
    }

    private static void MapSource(LocalFileWebViewHandler handler, IWebView webView)
    {
        if (handler.PlatformView is not WKWebView platformWebView)
        {
            WebViewHandler.MapSource(handler, webView);
            return;
        }

        if (webView.Source is UrlWebViewSource { Url: { Length: > 0 } url } &&
            url.StartsWith("file:", StringComparison.OrdinalIgnoreCase))
        {
            var fileUrl = NSUrl.FromString(url);
            if (fileUrl is not null)
            {
                var readAccess = fileUrl.RemoveLastPathComponent();
                platformWebView.LoadFileUrl(fileUrl, readAccess);
                return;
            }
        }

        WebViewHandler.MapSource(handler, webView);
    }
}
#endif
