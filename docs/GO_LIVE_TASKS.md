# Go-live tasks done in code (Curevan_Master_Task_List.xlsx)

| Task | What changed | Where |
|---|---|---|
| Phone format | `+91 951 444 6292` everywhere the number is shown | header, contact, legal pages, chat assistant |
| GL-15 earnings note | "100% of what your patient pays*" with the note "TDS, payment-gateway charges and applicable taxes are deducted" | Join as Therapist page, home pricing card, `src/lib/seo.ts` |
| GL-07 referral wording | takes the discount and commission from the server settings ("patients get 10% off, you earn 5%") | `dashboard/earnings`, `dashboard/therapist` |
| GL-04 fake AI summary | hard-coded "AI summary" boxes removed from all 5 dashboards (component deleted) | dashboards |
| GL-02 token / personal-data logs | Shiprocket token, login tokens, sign-up payload, FCM token, user-row dump, reset-password e-mail no longer logged | API + website |
| GL-03 refunds | care-pack refunds go through `refundService` (own refund row, webhook, `refund_pending` state); a refund that went out but could not cancel the booking raises an audit row + admin alert; the reconciliation lists failed / long-pending / "refunded but still active" refunds | API, migration `0023` |
| GL-05 e-mails | all 18 direct e-mail sends go through `notifications.sendEmailLogged` (e-mail channel, OTP guard, `notification_log`) | API |
| GL-08 Orders page | visible Track and Return buttons (also Track in the phone sheet); per-product "Not returnable" switch in the product form | `OrdersTable`, product form, API |
| GL-10 working hours | "Working Hours" shortcut on the therapist dashboard | `dashboard/therapist/my-dashboard` |
| S24 | product title / description capped to 60 / 160 characters | `src/lib/seo.ts`, product layout |

Needs migration `0023_refund_pack_and_returnable.sql` on the API database (`npm run migrate`).

Not done here (owner, vendor or production access needed): GL-01 production baseline, GL-06 CI run, GL-09 name-city therapist links (format to confirm), GL-11 seed exports, GL-12/13/16/17/18 owner decisions, GL-14 vendor accounts, GL-19 staging day, GL-20 runbook, GL-21 after go-live.
