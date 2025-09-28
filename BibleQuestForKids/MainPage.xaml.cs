using System;
using Microsoft.Maui.Controls;

namespace BibleQuestForKids;

public partial class MainPage : ContentPage
{
    private int _confirmationCount;

    public MainPage()
    {
        InitializeComponent();
    }

    private void OnConfirmTapped(object sender, EventArgs e)
    {
        _confirmationCount++;
        var tapMessage = _confirmationCount == 1
            ? "Great! Tap again if you see this update."
            : $"Confirmed {_confirmationCount} taps."
              + (_confirmationCount >= 3 ? " Looks good for TestFlight sanity checks." : string.Empty);

        StatusLabel.Text = tapMessage;
    }
}
