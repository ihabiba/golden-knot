from django.db import migrations


def create_missing_profiles(apps, schema_editor):
    User = apps.get_model("users", "User")
    SellerProfile = apps.get_model("store", "SellerProfile")
    for user in User.objects.filter(role="seller"):
        SellerProfile.objects.get_or_create(
            user=user,
            defaults={"store_name": user.username, "status": "pending"},
        )


class Migration(migrations.Migration):

    dependencies = [
        ("store", "0002_initial"),
    ]

    operations = [
        migrations.RunPython(create_missing_profiles, migrations.RunPython.noop),
    ]
