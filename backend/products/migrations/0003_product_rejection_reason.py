from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0002_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='rejection_reason',
            field=models.CharField(blank=True, max_length=500),
        ),
        migrations.AlterField(
            model_name='product',
            name='is_approved',
            field=models.BooleanField(default=True),
        ),
    ]
