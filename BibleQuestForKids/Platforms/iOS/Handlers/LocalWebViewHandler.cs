#if IOS
using System;
using Foundation;
using Microsoft.Maui.Controls;
using Microsoft.Maui.Handlers;
using WebKit;

namespace BibleQuestForKids.Platforms.iOS.Handlers;

// Ensure WKWebView can load bundled React assets that reference relative files.
internal class LocalWebViewHandler : WebViewHandler
{
    protected override void LoadSource(IWebViewSource source)
    {
        if (PlatformView is WKWebView webView &&
            source is UrlWebViewSource urlSource &&
            !string.IsNullOrWhiteSpace(urlSource.Url) &&
            urlSource.Url.StartsWith("file", StringComparison.OrdinalIgnoreCase))
        {
            var nsUrl = NSUrl.FromString(urlSource.Url);
            if (nsUrl is not null)
            {
                var readAccessUrl = nsUrl.RemoveLastPathComponent();
                webView.LoadFileUrl(nsUrl, readAccessUrl);
                return;
            }
        }

        base.LoadSource(source);
    }
}
#endif
