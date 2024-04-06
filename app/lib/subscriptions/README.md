# Volunteer Manager Subscriptions
Conventionally, communication regarding new accounts, incoming applications and so on would be
distributed by e-mail, requiring individuals to monitor inboxes that may not be their own. Other
messages may be more appropriate to be send over WhatsApp, however, preferences are subjective.

The subscription library implements a basic fanout mechanism that allows communication methods to
be tailored to an person's preferences, by individualising messaging channels.

### Eligibility
Subscriptions are not meant to be a feature for all known volunteers, but rather intended to be a
feature to communicate contextual and time sensitive messages to those who need to know. Based on
this principle, people:

  * Are **eligible** to receive subscriptions when they are granted the "_subscription eligibility_"
    permission as part of their account,
  * Are able to **manage** subscriptions on behalf of our teams when they are granted the
    "_subscription management_" permission as part of their account.

In summary, any user can be opted in to be _eligible_ to be subscribed, after which individual
subscriptions have to be _managed_ by a senior volunteer.

This directly supersedes places in which we e-mail individuals and/or mailing lists to let them know
that certain actions have happened, which are now considered to be an antipattern.

### Supported message channels
We support four message channels to deliver publications:

  1. E-mail, messages for which can be composed using Markdown,
  1. SMS, which will be distributed using [Twilio](https://twilio.com/),
  1. Web Push Notifications, which we will distribute ourselves,
  1. WhatsApp, which will be distributed using [Twilio](https://twilio.com/).

### Life of a Publication
Fundamentally this is a _pub/sub_ system: any code in the Volunteer Manager can **publish** that
something happened, which individuals, who are **subscribed** to those changes, will be informed of.
The _how_ is brokered by this system, which should be thought of as a fan-out system.

#### 1. Publish the occurrance of an event
```typescript
import { Publish, SubscriptionType } from '@lib/subscriptions';

async function submitApplication(application: Application) {
    // ... logic ...

    await Publish({
        type: SubscriptionType.Application,
        typeId: application.team.id,  // specific to the `type`
        sourceUserId: application.user.id,
        message: {
            name: application.user.name,
            team: application.team.name,
        },
    });
}
```

#### 2. Identify the individual subscriptions
The [`Publish()`](./Publish.sh) function will identify which users are marked as eligible, and have
existing subscriptions to the passed in `type`.

A [`Driver`](./Driver.ts) will then be created to handle distribution of that specific message,
which is dependent on message-specific text and templates. The
[`ApplicationDriver`](./drivers/ApplicationDriver.ts) is an example of this.

#### 3. Fanout to distribute individual messages
Messages will then be fanned out to individual distribution methods on that `Driver`, each specific
to a particular message channel such as e-mail, a SMS, Web Push Notifications and WhatsApp. These
will then compose the message, and schedule individual tasks with the [scheduler](../scheduler) in
order to manage out-of-band distribution.
