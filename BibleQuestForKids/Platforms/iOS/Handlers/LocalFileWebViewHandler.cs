#if IOS
using System;
using CoreGraphics;
using Foundation;
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

    protected override WKWebView CreatePlatformView()
    {
        var configuration = new WKWebViewConfiguration();
        configuration.SetValueForKey(NSNumber.FromBoolean(true), AllowFileAccessKey);
        configuration.SetValueForKey(NSNumber.FromBoolean(true), AllowUniversalFileAccessKey);
        return new WKWebView(CGRect.Empty, configuration);
    }

    public override void LoadUrl(string? url)
    {
        if (!string.IsNullOrEmpty(url) && url.StartsWith("file:", StringComparison.OrdinalIgnoreCase))
        {
            var fileUrl = NSUrl.FromString(url);
            if (fileUrl is not null)
            {
                var readAccess = fileUrl.RemoveLastPathComponent();
                PlatformView.LoadFileUrl(fileUrl, readAccess);
                return;
            }
        }

        base.LoadUrl(url);
    }
}
#endif
