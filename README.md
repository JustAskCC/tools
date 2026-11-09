# Just Ask CC Tools

Free, simple web tools for entrepreneurs, small businesses, and the organizations that support them. Built by CiCi Caver of [Just Ask CC](https://justaskcc.com) and live at **[tools.justaskcc.com](https://tools.justaskcc.com)**.

**You are welcome to copy these tools and adapt them for your own organization.** They are free under the MIT License. All we ask is that you keep the license file, which credits the original.

## Tools in this collection

| Tool | Folder | Live version |
|---|---|---|
| Workshop Calendar | `workshopcalendar/` | [tools.justaskcc.com/workshopcalendar](https://tools.justaskcc.com/workshopcalendar/) |

## Make your own copy (free, about 15 minutes)

You need a free GitHub account. No coding experience required.

1. Click the green **Use this template** button at the top of this page (or **Fork**), and create the copy in your own GitHub account.
2. In your copy, **delete the file named `CNAME`**. It points to tools.justaskcc.com, and your copy needs its own address.
3. Go to **Settings**, then **Pages**. Under Build and deployment, choose **Deploy from a branch**, branch **main**, folder **/ (root)**, then **Save**.
4. After a minute or two your copy is live at `https://YOURNAME.github.io/REPOSITORYNAME/`. You can add your own domain on that same Pages screen.

## Adapt the Workshop Calendar for your organization

Everything lives in one file: `workshopcalendar/index.html`. The demo uses sample data; replace it with yours. You can rename the folder (for example to `workshops`). Edit the file right on GitHub by clicking it, then the pencil icon.

### Your workshops

Near the bottom of the file is a block that starts with `<script id="calendar-data" type="application/json">`. That block holds all the data. Each workshop looks like this:

```json
{
  "id": "2027-03-04-grantwriting",
  "date": "2027-03-04",
  "title": "Grant Writing Basics",
  "time": "12:00 PM",
  "location": "Zoom",
  "presenter": "Jane Smith",
  "partner": "Community Bank",
  "host": "Alex Lee",
  "category": "Nonprofit",
  "description": "Two or three sentences about the workshop.",
  "caption": "Social media post. {date}, {time}, {location} and {link} fill in automatically.",
  "link": "https://your-registration-page",
  "checks": [false, false, false, false, false, false, false, false, false, false]
}
```

Tips:

1. Dates are written year, month, day, like `2027-03-04`.
2. A location containing the word "Zoom" shows as online. Anything else shows as in person.
3. If `link` is empty, the Register button uses `defaultLink`, which you set near the end of the block.
4. `checks` matches the task names listed in `"checks"` at the start of the block. Change those names to fit your team's process.
5. `tbd` is a list of workshops still being scheduled.

### Your name, wording and colors

1. **Name and wording:** search the file for "Your Organization" and "Workshop Calendar" and replace them with your organization's name. Update the footer email (events@example.org) too.
2. **Colors:** at the top of the file, inside `:root { ... }`, change `--accent` (main color) and `--gold` (highlight color).
3. **Topic colors:** search for `CAT_COLOR` to rename the topic categories or change their colors.

## Questions or ideas

Have an idea for a new tool, or want help adapting one? Email Cc@justaskcc.com.

## License

MIT. See [LICENSE](LICENSE). Copyright 2026 CiCi Caver, Just Ask CC.
