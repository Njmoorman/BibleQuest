using Microsoft.Maui.ApplicationModel;
using Microsoft.Maui.Controls;
using Microsoft.Maui.Storage;
using System;
using System.IO;

#if IOS || MACCATALYST
using Foundation;
#endif

namespace BibleQuestForKids;

public partial class MainPage : ContentPage
{
    private bool _isBrowserInitialized;

    public MainPage()
    {
        InitializeComponent();
        Loaded += OnLoaded;
    }

    private void OnLoaded(object? sender, EventArgs e)
    {
        if (_isBrowserInitialized)
        {
            return;
        }

        _isBrowserInitialized = true;
        Loaded -= OnLoaded;

        var indexPath = EnsureWebAssets();
        var indexUri = new Uri(indexPath).AbsoluteUri;

        Browser.Source = new UrlWebViewSource { Url = indexUri };
    }

    private static string EnsureWebAssets()
    {
        // React/Vite assets are produced into wwwroot/dist via `npm run build`.
        // Codemagic runs this step before each MAUI build (see codemagic.yaml),
        // but developers should re-run it locally whenever the web app changes.
        const string cacheFolderName = "webview";

        var packageRoot = GetPackageAssetRoot();
        var versionKey = GetVersionStamp();
        var cacheRoot = Path.Combine(FileSystem.AppDataDirectory, cacheFolderName, versionKey);
        Directory.CreateDirectory(cacheRoot);

        PruneStaleCaches(Path.Combine(FileSystem.AppDataDirectory, cacheFolderName), versionKey);

        // Prefer the production bundle (wwwroot/dist) but fall back to the development
        // root (wwwroot) when running without a compiled build. This mirrors the
        // documented workflow of running `npm run build` before packaging while still
        // supporting quick debug iterations.
        foreach (var relativeRoot in new[] { "dist", string.Empty })
        {
            var packageAssetRoot = string.IsNullOrEmpty(relativeRoot)
                ? packageRoot
                : Path.Combine(packageRoot, relativeRoot);

            var packageIndex = Path.Combine(packageAssetRoot, "index.html");
            if (!File.Exists(packageIndex))
            {
                continue;
            }

            var targetAssetRoot = string.IsNullOrEmpty(relativeRoot)
                ? cacheRoot
                : Path.Combine(cacheRoot, relativeRoot);

            var targetIndex = Path.Combine(targetAssetRoot, "index.html");

            if (!File.Exists(targetIndex))
            {
                CopyDirectory(packageAssetRoot, targetAssetRoot);
            }

            if (File.Exists(targetIndex))
            {
                return targetIndex;
            }
        }

        throw new FileNotFoundException("Unable to locate the bundled web assets.", packageRoot);
    }

    private static string GetVersionStamp()
    {
        var version = AppInfo.Current.VersionString;
        var build = AppInfo.Current.BuildString;
        return string.IsNullOrEmpty(build) ? version : $"{version}-{build}";
    }

    private static string GetPackageAssetRoot()
    {
#if IOS || MACCATALYST
        // NSBundle ensures we resolve the on-device app bundle regardless of TestFlight/App Store packaging.
        return Path.Combine(NSBundle.MainBundle.BundlePath, "wwwroot");
#else
        // For Android (and other targets) rely on MAUI's abstraction when available.
        return Path.Combine(FileSystem.AppPackageDirectory, "wwwroot");
#endif
    }

    private static void PruneStaleCaches(string cacheBase, string activeStamp)
    {
        if (!Directory.Exists(cacheBase))
        {
            return;
        }

        foreach (var directory in Directory.GetDirectories(cacheBase))
        {
            var name = Path.GetFileName(directory);
            if (string.Equals(name, activeStamp, StringComparison.Ordinal))
            {
                continue;
            }

            try
            {
                Directory.Delete(directory, recursive: true);
            }
            catch
            {
                // Ignore IO contention on best-effort cleanup. Leftover folders
                // are harmless, but the active version stays intact.
            }
        }
    }

    private static void CopyDirectory(string sourceDir, string destinationDir)
    {
        if (!Directory.Exists(sourceDir))
        {
            throw new DirectoryNotFoundException($"Source asset folder not found: {sourceDir}");
        }

        Directory.CreateDirectory(destinationDir);

        foreach (var directoryPath in Directory.GetDirectories(sourceDir, "*", SearchOption.AllDirectories))
        {
            var relativeDir = Path.GetRelativePath(sourceDir, directoryPath);
            var targetDir = Path.Combine(destinationDir, relativeDir);
            Directory.CreateDirectory(targetDir);
        }

        foreach (var filePath in Directory.GetFiles(sourceDir, "*", SearchOption.AllDirectories))
        {
            var relativeFile = Path.GetRelativePath(sourceDir, filePath);
            var targetFile = Path.Combine(destinationDir, relativeFile);

            var targetDirectory = Path.GetDirectoryName(targetFile);
            if (!string.IsNullOrEmpty(targetDirectory))
            {
                Directory.CreateDirectory(targetDirectory);
            }

            File.Copy(filePath, targetFile, overwrite: true);
        }
    }
}
